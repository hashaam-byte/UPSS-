// /app/api/protected/teacher/class/performance/[studentId]/route.js - CASE-INSENSITIVE VERSION
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

// ✅ Helper function to normalize class names for comparison
function normalizeClassName(className) {
  if (!className) return '';
  return className.trim().toUpperCase().replace(/\s+/g, ' ');
}

// Helper function to determine current term
function getCurrentTerm(date) {
  const month = date.getMonth() + 1; // 0-based to 1-based
  
  if (month >= 9 && month <= 12) {
    return 'First Term';
  } else if (month >= 1 && month <= 4) {
    return 'Second Term';
  } else {
    return 'Third Term';
  }
}

export async function GET(request, { params }) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { studentId } = params;

    if (!studentId) {
      return NextResponse.json({
        error: 'Student ID is required'
      }, { status: 400 });
    }

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

    // ✅ FIX: Normalize assigned classes for case-insensitive comparison
    const normalizedAssignedClasses = classNames.map(cls => normalizeClassName(cls));

    // ✅ FIX: Verify student belongs to teacher's class (case-insensitive)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: classTeacher.schoolId,
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

    // Get current academic year and term
    const currentDate = new Date();
    const academicYear = currentDate.getFullYear().toString();
    const currentTerm = getCurrentTerm(currentDate);

    // Get detailed grade history (last 3 terms)
    const gradeHistory = await prisma.grade.findMany({
      where: {
        studentId: student.id,
        schoolId: classTeacher.schoolId,
        academicYear: academicYear
      },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { assessmentDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Group grades by subject and term
    const subjectPerformance = {};
    const termAverages = {};

    gradeHistory.forEach(grade => {
      const subjectName = grade.subject.name;
      const term = grade.term;

      if (!subjectPerformance[subjectName]) {
        subjectPerformance[subjectName] = {
          subject: grade.subject,
          grades: [],
          currentAverage: 0,
          trend: 'stable'
        };
      }

      if (!termAverages[term]) {
        termAverages[term] = [];
      }

      subjectPerformance[subjectName].grades.push({
        id: grade.id,
        score: grade.score,
        maxScore: grade.maxScore,
        percentage: grade.percentage,
        grade: grade.grade,
        assessmentType: grade.assessmentType,
        assessmentName: grade.assessmentName,
        assessmentDate: grade.assessmentDate,
        term: grade.term,
        comments: grade.comments,
        teacher: `${grade.teacher.firstName} ${grade.teacher.lastName}`
      });

      termAverages[term].push(grade.percentage);
    });

    // Calculate current averages and trends for each subject
    Object.keys(subjectPerformance).forEach(subjectName => {
      const grades = subjectPerformance[subjectName].grades;
      const currentTermGrades = grades.filter(g => g.term === currentTerm);
      
      if (currentTermGrades.length > 0) {
        subjectPerformance[subjectName].currentAverage = 
          currentTermGrades.reduce((sum, g) => sum + g.percentage, 0) / currentTermGrades.length;
      }

      // Simple trend calculation (compare current term to previous)
      const previousTerms = ['First Term', 'Second Term', 'Third Term'];
      const currentTermIndex = previousTerms.indexOf(currentTerm);
      
      if (currentTermIndex > 0) {
        const previousTerm = previousTerms[currentTermIndex - 1];
        const previousTermGrades = grades.filter(g => g.term === previousTerm);
        
        if (previousTermGrades.length > 0 && currentTermGrades.length > 0) {
          const previousAverage = previousTermGrades.reduce((sum, g) => sum + g.percentage, 0) / previousTermGrades.length;
          const currentAverage = subjectPerformance[subjectName].currentAverage;
          
          if (currentAverage > previousAverage + 5) {
            subjectPerformance[subjectName].trend = 'improving';
          } else if (currentAverage < previousAverage - 5) {
            subjectPerformance[subjectName].trend = 'declining';
          }
        }
      }
    });

    // Calculate term averages
    const termAverageData = Object.entries(termAverages).map(([term, scores]) => ({
      term,
      average: scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
      gradeCount: scores.length
    })).sort((a, b) => {
      const termOrder = { 'First Term': 1, 'Second Term': 2, 'Third Term': 3 };
      return termOrder[a.term] - termOrder[b.term];
    });

    // Get attendance history (last 60 days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const attendanceHistory = await prisma.attendance.findMany({
      where: {
        studentId: student.id,
        schoolId: classTeacher.schoolId,
        date: {
          gte: sixtyDaysAgo
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate attendance statistics
    const attendanceStats = {
      totalDays: attendanceHistory.length,
      presentDays: attendanceHistory.filter(a => a.status === 'present').length,
      lateDays: attendanceHistory.filter(a => a.status === 'late').length,
      absentDays: attendanceHistory.filter(a => a.status === 'absent').length,
      excusedAbsences: attendanceHistory.filter(a => a.status === 'excused').length,
      rate: 0,
      recentPattern: []
    };

    if (attendanceStats.totalDays > 0) {
      attendanceStats.rate = ((attendanceStats.presentDays + attendanceStats.lateDays) / attendanceStats.totalDays) * 100;
    }

    // Recent attendance pattern (last 10 days)
    attendanceStats.recentPattern = attendanceHistory.slice(0, 10).map(record => ({
      date: record.date,
      status: record.status,
      arrivalTime: record.arrivalTime,
      notes: record.notes
    }));

    // Get assignment completion data
    const assignments = await prisma.assignment.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        classes: {
          hasSome: [student.studentProfile?.className].filter(Boolean)
        },
        createdAt: {
          gte: sixtyDaysAgo
        }
      },
      include: {
        subject: true,
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: student.id,
        assignment: {
          id: {
            in: assignments.map(a => a.id)
          }
        }
      },
      include: {
        assignment: {
          include: {
            subject: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    const assignmentData = assignments.map(assignment => {
      const submission = submissions.find(s => s.assignmentId === assignment.id);
      
      return {
        id: assignment.id,
        title: assignment.title,
        subject: assignment.subject.name,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        assignmentType: assignment.assignmentType,
        teacher: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
        status: submission ? 'submitted' : 'missing',
        submittedAt: submission?.submittedAt || null,
        score: submission?.score || null,
        feedback: submission?.feedback || null,
        isLate: submission ? submission.isLateSubmission : (new Date() > new Date(assignment.dueDate))
      };
    });

    // Get active alerts and history
    const alerts = await prisma.studentAlert.findMany({
      where: {
        studentId: student.id,
        schoolId: classTeacher.schoolId
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        resolver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    // Calculate overall performance metrics
    const currentTermGrades = gradeHistory.filter(g => g.term === currentTerm);
    const overallAverage = currentTermGrades.length > 0 
      ? currentTermGrades.reduce((sum, g) => sum + g.percentage, 0) / currentTermGrades.length
      : 0;

    const assignmentCompletion = assignments.length > 0 
      ? (submissions.length / assignments.length) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          avatar: student.avatar,
          profile: student.studentProfile ? {
            studentId: student.studentProfile.studentId,
            className: student.studentProfile.className,
            section: student.studentProfile.section,
            department: student.studentProfile.department,
            parentName: student.studentProfile.parentName,
            parentPhone: student.studentProfile.parentPhone,
            parentEmail: student.studentProfile.parentEmail,
            admissionDate: student.studentProfile.admissionDate
          } : null
        },
        performance: {
          overallAverage: Number(overallAverage.toFixed(1)),
          termAverages: termAverageData,
          subjectPerformance: Object.values(subjectPerformance),
          assignmentCompletion: Number(assignmentCompletion.toFixed(1)),
          totalAssignments: assignments.length,
          submittedAssignments: submissions.length
        },
        attendance: {
          ...attendanceStats,
          rate: Number(attendanceStats.rate.toFixed(1))
        },
        assignments: assignmentData,
        alerts: alerts.map(alert => ({
          id: alert.id,
          type: alert.alertType,
          title: alert.title,
          description: alert.description,
          priority: alert.priority,
          status: alert.status,
          createdAt: alert.createdAt,
          resolvedAt: alert.resolvedAt,
          creator: `${alert.creator.firstName} ${alert.creator.lastName}`,
          resolver: alert.resolver ? `${alert.resolver.firstName} ${alert.resolver.lastName}` : null,
          resolution: alert.resolution
        })),
        metadata: {
          currentTerm,
          academicYear,
          dataRange: '60 days',
          lastUpdated: currentDate
        }
      }
    });

  } catch (error) {
    console.error('Student detail GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}