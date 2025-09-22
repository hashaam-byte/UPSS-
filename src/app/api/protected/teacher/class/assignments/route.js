// /app/api/protected/teacher/class/assignments/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify class teacher access
async function verifyClassTeacherAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }, 
      school: true 
    }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'class_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

// GET - Fetch assignments overview for class teacher's students
export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const subject = searchParams.get('subject') || 'all';
    const studentId = searchParams.get('studentId');
    const dueDate = searchParams.get('dueDate');
    const assignmentId = searchParams.get('assignmentId');

    // Get assigned classes
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    if (classNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          assignments: [],
          summary: { totalAssignments: 0, submitted: 0, pending: 0, overdue: 0 },
          message: 'No class assigned to this class teacher'
        }
      });
    }

    // Get students in assigned classes
    const students = await prisma.user.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: classNames
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
        assignedClasses: classNames,
        availableSubjects: [...new Set(mockAssignments.map(a => a.subject))],
        filters: {
          status,
          subject,
          studentId,
          dueDate
        },
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          assignedClasses: classNames
        }
      }
    });

  } catch (error) {
    console.error('Class teacher assignments GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create assignment reminder or flag for follow-up
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { studentId, assignmentId, reminderType, message, priority = 'normal' } = body;

    if (!studentId || !assignmentId || !reminderType) {
      return NextResponse.json({
        error: 'Student ID, assignment ID, and reminder type are required'
      }, { status: 400 });
    }

    // Verify student belongs to teacher's class
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: classTeacher.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: classNames
          }
        }
      }
    });

    if (!student) {
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
        schoolId: classTeacher.schoolId,
        title: notificationTitle,
        content: message || `Assignment reminder from your class teacher`,
        type: notificationType,
        priority: priority,
        isRead: false
      }
    });

    // TODO: In production, you might also:
    // - Send email/SMS to parent if it's a serious concern
    // - Log the action in assignment_reminders table
    // - Create calendar reminder for teacher

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
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}