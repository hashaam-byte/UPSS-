// /app/api/protected/teacher/class/assignments/route.js - CASE-INSENSITIVE VERSION
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Helper function to normalize class names for comparison
function normalizeClassName(className) {
  if (!className) return '';
  return className.trim().toUpperCase().replace(/\s+/g, ' ');
}

// GET - Fetch assignments overview for class teacher's students
export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const subject = searchParams.get('subject') || 'all';
    const studentId = searchParams.get('studentId');
    const dueDate = searchParams.get('dueDate');
    const assignmentId = searchParams.get('assignmentId');

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    if (assignedClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          assignments: [],
          summary: { totalAssignments: 0, submitted: 0, pending: 0, overdue: 0 },
          message: 'No class assigned to this class teacher'
        }
      });
    }

    // ✅ FIX: Normalize assigned classes for case-insensitive comparison
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    // ✅ FIX: Get ALL students from school, then filter case-insensitively
    const allStudentsInSchool = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            not: null
          }
        },
        ...(studentId && { id: studentId })
      },
      include: {
        studentProfile: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Filter students by normalized class names (case-insensitive)
    const students = allStudentsInSchool.filter(student => {
      const studentClassName = student.studentProfile?.className;
      if (!studentClassName) return false;
      
      const normalizedStudentClass = normalizeClassName(studentClassName);
      return normalizedAssignedClasses.includes(normalizedStudentClass);
    });

    // TODO: In production, this would query actual assignments and submissions tables
    // For now, generate mock assignment data
    const mockAssignments = [];
    const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology'];
    const assignmentTypes = ['Homework', 'Project', 'Quiz', 'Essay', 'Lab Report'];
    
    // Generate assignments for each student
    students.forEach(student => {
      for (let i = 0; i < 5; i++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) - 15);
        
        const isOverdue = dueDate < new Date();
        const isSubmitted = Math.random() > 0.3;
        const submissionDate = isSubmitted 
          ? new Date(dueDate.getTime() - Math.floor(Math.random() * 5 * 24 * 60 * 60 * 1000))
          : null;

        mockAssignments.push({
          id: `assignment_${student.id}_${i}`,
          title: `${assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)]} ${i + 1}`,
          description: `Assignment description for ${student.firstName}`,
          subject: subjects[Math.floor(Math.random() * subjects.length)],
          assignmentType: assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)],
          dueDate: dueDate,
          maxScore: 100,
          studentId: student.id,
          student: {
            id: student.id,
            name: `${student.firstName} ${student.lastName}`,
            className: student.studentProfile?.className,
            studentId: student.studentProfile?.studentId
          },
          submission: isSubmitted ? {
            id: `submission_${student.id}_${i}`,
            submittedAt: submissionDate,
            status: isOverdue && !isSubmitted ? 'late' : isSubmitted ? 'submitted' : 'pending',
            score: isSubmitted ? Math.floor(Math.random() * 40) + 60 : null,
            feedback: isSubmitted ? 'Good work, but could be improved' : null,
            attachments: []
          } : null,
          status: !isSubmitted && isOverdue ? 'overdue' : 
                  !isSubmitted ? 'pending' : 
                  isOverdue && isSubmitted ? 'late_submission' : 'submitted'
        });
      }
    });

    // Apply filters
    let filteredAssignments = mockAssignments;

    if (status !== 'all') {
      filteredAssignments = filteredAssignments.filter(assignment => {
        switch (status) {
          case 'pending':
            return assignment.status === 'pending';
          case 'submitted':
            return assignment.status === 'submitted';
          case 'overdue':
            return assignment.status === 'overdue';
          case 'late':
            return assignment.status === 'late_submission';
          default:
            return true;
        }
      });
    }

    if (subject !== 'all') {
      filteredAssignments = filteredAssignments.filter(assignment => 
        assignment.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    if (assignmentId) {
      filteredAssignments = filteredAssignments.filter(assignment => 
        assignment.id === assignmentId
      );
    }

    // Calculate summary statistics
    const summary = {
      totalAssignments: filteredAssignments.length,
      submitted: filteredAssignments.filter(a => a.status === 'submitted').length,
      pending: filteredAssignments.filter(a => a.status === 'pending').length,
      overdue: filteredAssignments.filter(a => a.status === 'overdue').length,
      lateSubmissions: filteredAssignments.filter(a => a.status === 'late_submission').length,
      averageScore: filteredAssignments
        .filter(a => a.submission?.score)
        .reduce((acc, a, _, arr) => acc + (a.submission.score / arr.length), 0) || 0
    };

    // Group assignments by student for better overview
    const assignmentsByStudent = students.map(student => {
      const studentAssignments = filteredAssignments.filter(a => a.studentId === student.id);
      return {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          className: student.studentProfile?.className,
          studentId: student.studentProfile?.studentId
        },
        assignments: studentAssignments,
        summary: {
          total: studentAssignments.length,
          submitted: studentAssignments.filter(a => a.status === 'submitted').length,
          pending: studentAssignments.filter(a => a.status === 'pending').length,
          overdue: studentAssignments.filter(a => a.status === 'overdue').length,
          averageScore: studentAssignments
            .filter(a => a.submission?.score)
            .reduce((acc, a, _, arr) => acc + (a.submission.score / arr.length), 0) || 0
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assignments: filteredAssignments,
        assignmentsByStudent: assignmentsByStudent,
        summary: summary,
        assignedClasses: assignedClasses,
        availableSubjects: [...new Set(mockAssignments.map(a => a.subject))],
        filters: {
          status,
          subject,
          studentId,
          dueDate
        },
        teacherInfo: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          assignedClasses: assignedClasses
        }
      }
    });

  } catch (error) {
    console.error('Class teacher assignments GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create assignment reminder or flag for follow-up
export async function POST(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const body = await request.json();
    const { studentId, assignmentId, reminderType, message, priority = 'normal' } = body;

    if (!studentId || !assignmentId || !reminderType) {
      return NextResponse.json({
        error: 'Student ID, assignment ID, and reminder type are required'
      }, { status: 400 });
    }

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    // ✅ FIX: Verify student belongs to teacher's class (case-insensitive)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        role: 'student',
        isActive: true
      },
      include: {
        studentProfile: true
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found'
      }, { status: 404 });
    }

    // Check if student's class matches teacher's assigned classes (case-insensitive)
    const studentClassName = student.studentProfile?.className;
    const normalizedStudentClass = normalizeClassName(studentClassName);
    
    if (!normalizedAssignedClasses.includes(normalizedStudentClass)) {
      return NextResponse.json({
        error: 'Student not found in your assigned class'
      }, { status: 404 });
    }

    // Create notification based on reminder type
    let notificationTitle = '';
    let notificationType = 'info';

    switch (reminderType) {
      case 'submission_reminder':
        notificationTitle = 'Assignment Submission Reminder';
        notificationType = 'info';
        break;
      case 'overdue_alert':
        notificationTitle = 'Overdue Assignment Alert';
        notificationType = 'warning';
        break;
      case 'performance_concern':
        notificationTitle = 'Performance Concern';
        notificationType = 'warning';
        break;
      case 'improvement_needed':
        notificationTitle = 'Improvement Needed';
        notificationType = 'error';
        break;
      default:
        notificationTitle = 'Assignment Follow-up';
    }

    await prisma.notification.create({
      data: {
        userId: studentId,
        schoolId: user.schoolId,
        title: notificationTitle,
        content: message || `Assignment reminder from your class teacher`,
        type: notificationType,
        priority: priority,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment reminder created successfully',
      data: {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        assignmentId,
        reminderType,
        sentAt: new Date()
      }
    });

  } catch (error) {
    console.error('Create assignment reminder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}