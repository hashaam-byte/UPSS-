// /app/api/protected/students/dashboard/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    // Fetch recent assignments (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingAssignments = await prisma.assignment.findMany({
      where: {
        schoolId: user.schoolId,
        classes: {
          has: studentProfile?.className
        },
        status: 'active',
        dueDate: {
          gte: new Date(),
          lte: sevenDaysFromNow
        }
      },
      include: {
        subject: {
          select: {
            name: true
          }
        },
        submissions: {
          where: {
            studentId: user.id
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 5
    });

    // Fetch recent grades (last 5)
    const recentGrades = await prisma.grade.findMany({
      where: {
        studentId: user.id
      },
      include: {
        subject: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        assessmentDate: 'desc'
      },
      take: 5
    });

    // Fetch today's classes
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todayClasses = await prisma.timetable.findMany({
      where: {
        schoolId: user.schoolId,
        className: studentProfile?.className,
        dayOfWeek: today
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        period: 'asc'
      },
      take: 4
    });

    // Calculate performance statistics
    const allGrades = await prisma.grade.findMany({
      where: {
        studentId: user.id
      }
    });

    const currentGPA = allGrades.length > 0
      ? calculateGPA(allGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / allGrades.length)
      : 0;

    const averageScore = allGrades.length > 0
      ? Math.round(allGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / allGrades.length)
      : 0;

    // Get attendance rate (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: user.id,
        date: {
          gte: thirtyDaysAgo
        }
      }
    });

    const attendanceRate = attendance.length > 0
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
      : 0;

    // Get assignment completion rate
    const allAssignments = await prisma.assignment.findMany({
      where: {
        schoolId: user.schoolId,
        classes: {
          has: studentProfile?.className
        },
        status: 'active'
      }
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: user.id,
        assignment: {
          id: {
            in: allAssignments.map(a => a.id)
          }
        }
      }
    });

    const assignmentCompletion = allAssignments.length > 0
      ? Math.round((submissions.length / allAssignments.length) * 100)
      : 0;

    // Transform data
    const transformedAssignments = upcomingAssignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      subject: assignment.subject.name,
      dueDate: assignment.dueDate,
      hasSubmitted: assignment.submissions.length > 0
    }));

    const transformedGrades = recentGrades.map(grade => ({
      subject: grade.subject.name,
      assessment: grade.assessmentName,
      score: Number(grade.percentage)
    }));

    const transformedClasses = todayClasses.map(classItem => ({
      subject: classItem.subject,
      time: `${classItem.startTime}`,
      teacher: `${classItem.teacher.firstName} ${classItem.teacher.lastName}`,
      room: 'Room 101' // Add to schema if needed
    }));

    return NextResponse.json({
      success: true,
      data: {
        assignments: {
          assignments: transformedAssignments
        },
        grades: {
          grades: transformedGrades
        },
        timetable: {
          classes: transformedClasses
        },
        performance: {
          overallStats: {
            currentGPA,
            averageScore,
            attendanceRate,
            assignmentCompletion
          }
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

function calculateGPA(percentage) {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.0;
  if (percentage >= 70) return 2.0;
  if (percentage >= 60) return 1.0;
  return 0.0;
}