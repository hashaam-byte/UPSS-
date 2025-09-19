import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // Ensure user is a director
    const director = await prisma.user.findFirst({
      where: {
        id: user.id,
        teacherProfile: {
          department: 'director'
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

    if (!director) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get classes from TeacherSubjects
    const classes = director.teacherProfile.teacherSubjects.flatMap(ts => ts.classes);
    const uniqueClasses = [...new Set(classes)];

    // Get dashboard statistics
    const [totalStudents, activeStudents, totalTeachers, recentActivities] = await Promise.all([
      // Total students in these classes
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

      // Active students (logged in within last 7 days)
      prisma.user.count({
        where: {
          role: 'student',
          schoolId: user.schoolId,
          studentProfile: {
            className: {
              in: uniqueClasses
            }
          },
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Total teachers in the school
      prisma.user.count({
        where: {
          role: 'teacher',
          schoolId: user.schoolId,
          teacherProfile: {
            NOT: {
              department: 'director'
            }
          }
        }
      }),

      // Recent activities
      prisma.auditLog.findMany({
        where: {
          user: {
            schoolId: user.schoolId,
            OR: [
              {
                role: 'teacher',
                teacherProfile: {
                  department: {
                    not: 'director'
                  }
                }
              },
              {
                role: 'student',
                studentProfile: {
                  className: {
                    in: uniqueClasses
                  }
                }
              }
            ]
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      })
    ]);

    // Get class statistics
    const classStats = await Promise.all(
      uniqueClasses.map(async (className) => {
        const studentCount = await prisma.user.count({
          where: {
            role: 'student',
            schoolId: user.schoolId,
            studentProfile: {
              className
            }
          }
        });

        return {
          className,
          studentCount,
          // Add more class-specific stats here
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          totalTeachers,
          classCount: uniqueClasses.length
        },
        classStats,
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          action: activity.action,
          resource: activity.resource,
          description: activity.description,
          createdAt: activity.createdAt,
          user: {
            name: `${activity.user.firstName} ${activity.user.lastName}`,
            role: activity.user.role
          }
        })),
        classes: uniqueClasses
      }
    });

  } catch (error) {
    console.error('Director dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
