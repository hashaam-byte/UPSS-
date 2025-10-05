// /app/api/protected/students/subjects/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);

    // Get student's class
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    if (!studentProfile || !studentProfile.className) {
      return NextResponse.json({
        success: true,
        data: { subjects: [] }
      });
    }

    // Get subjects for student's class
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: user.schoolId,
        classes: {
          has: studentProfile.className
        },
        isActive: true
      },
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Calculate performance for each subject
    const subjectsWithPerformance = await Promise.all(
      subjects.map(async (subject) => {
        // Get grades for this subject
        const grades = await prisma.grade.findMany({
          where: {
            studentId: user.id,
            subjectId: subject.id
          },
          orderBy: {
            assessmentDate: 'desc'
          },
          take: 10
        });

        // Calculate average
        const average = grades.length > 0
          ? grades.reduce((sum, grade) => sum + Number(grade.percentage), 0) / grades.length
          : 0;

        // Get assignments count
        const assignments = await prisma.assignment.findMany({
          where: {
            subjectId: subject.id,
            classes: {
              has: studentProfile.className
            },
            status: 'active'
          }
        });

        // Get completed assignments
        const completedAssignments = await prisma.assignmentSubmission.findMany({
          where: {
            studentId: user.id,
            assignment: {
              subjectId: subject.id
            }
          }
        });

        // Calculate trend
        let trend = 'stable';
        if (grades.length >= 2) {
          const recent = Number(grades[0].percentage);
          const previous = Number(grades[1].percentage);
          if (recent > previous + 5) trend = 'improving';
          else if (recent < previous - 5) trend = 'declining';
        }

        // Get attendance for this subject
        const attendance = await prisma.attendance.findMany({
          where: {
            studentId: user.id,
            date: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
            }
          }
        });

        const attendanceRate = attendance.length > 0
          ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100
          : 0;

        // Get teacher info
        const teacher = subject.teachers[0]?.teacher.user;

        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          category: subject.category,
          teacher: teacher ? {
            name: `${teacher.firstName} ${teacher.lastName}`
          } : null,
          performance: {
            currentAverage: Math.round(average),
            completedAssignments: completedAssignments.length,
            totalAssessments: grades.length,
            attendanceRate: Math.round(attendanceRate),
            trend,
            highestScore: grades.length > 0 ? Math.max(...grades.map(g => Number(g.percentage))) : 0
          },
          schedule: 'Mon, Wed, Fri 10:00 AM' // You can get this from timetable if needed
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        subjects: subjectsWithPerformance
      }
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}
