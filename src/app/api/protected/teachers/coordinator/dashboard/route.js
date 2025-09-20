import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // Ensure user is a coordinator
    const coordinator = await prisma.user.findFirst({
      where: {
        id: user.id,
        teacherProfile: {
          department: 'coordinator'
        }
      },
      include: {
        teacherProfile: {
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    if (!coordinator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get classes the coordinator manages from TeacherSubjects
    const classes = coordinator.teacherProfile.teacherSubjects.flatMap(ts => ts.classes);
    const uniqueClasses = [...new Set(classes)];

    // Get dashboard statistics
    const [totalStudents, totalTeachers, pendingTimetables, totalTimetableSlots] = await Promise.all([
      // Total students in coordinator's classes
      prisma.user.count({
        where: {
          role: 'student',
          schoolId: user.schoolId,
          studentProfile: {
            className: {
              in: uniqueClasses
            }
          }
        }
      }),

      // Total teachers in the school (excluding directors and coordinators)
      prisma.user.count({
        where: {
          role: 'teacher',
          schoolId: user.schoolId,
          teacherProfile: {
            department: {
              in: ['class_teacher', 'subject_teacher']
            }
          }
        }
      }),

      // Count timetable slots that need approval (created by this coordinator)
      prisma.timetable.count({
        where: {
          schoolId: user.schoolId,
          className: {
            in: uniqueClasses
          },
          createdById: user.id
        }
      }),

      // Total timetable slots for coordinator's classes
      prisma.timetable.count({
        where: {
          schoolId: user.schoolId,
          className: {
            in: uniqueClasses
          }
        }
      })
    ]);

    // Get recent timetable activities
    const recentActivities = await prisma.timetable.findMany({
      where: {
        schoolId: user.schoolId,
        className: {
          in: uniqueClasses
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Get class distribution
    const classStats = await Promise.all(
      uniqueClasses.map(async (className) => {
        const [studentCount, timetableSlots] = await Promise.all([
          prisma.user.count({
            where: {
              role: 'student',
              schoolId: user.schoolId,
              studentProfile: {
                className
              }
            }
          }),
          prisma.timetable.count({
            where: {
              schoolId: user.schoolId,
              className
            }
          })
        ]);

        return {
          className,
          studentCount,
          timetableSlots,
          completionRate: timetableSlots > 0 ? Math.round((timetableSlots / 30) * 100) : 0 // Assuming 30 total slots per week
        };
      })
    );

    // Get available teachers for assignment
    const availableTeachers = await prisma.user.count({
      where: {
        role: 'teacher',
        schoolId: user.schoolId,
        isActive: true,
        teacherProfile: {
          department: {
            in: ['subject_teacher', 'class_teacher']
          }
        }
      }
    });

    // Calculate timetable completion percentage
    const maxSlotsPerClass = 30; // 6 periods × 5 days
    const totalPossibleSlots = uniqueClasses.length * maxSlotsPerClass;
    const timetableCompletion = totalPossibleSlots > 0 
      ? Math.round((totalTimetableSlots / totalPossibleSlots) * 100) 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          totalTeachers: availableTeachers,
          totalTimetableSlots,
          pendingTimetables,
          timetableCompletion,
          classCount: uniqueClasses.length
        },
        classStats,
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          className: activity.className,
          subject: activity.subject,
          dayOfWeek: activity.dayOfWeek,
          period: activity.period,
          teacher: {
            name: `${activity.teacher.firstName} ${activity.teacher.lastName}`
          },
          createdAt: activity.createdAt
        })),
        classes: uniqueClasses,
        coordinator: {
          id: coordinator.id,
          name: `${coordinator.firstName} ${coordinator.lastName}`,
          email: coordinator.email,
          classes: uniqueClasses
        }
      }
    });

  } catch (error) {
    console.error('Coordinator dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}