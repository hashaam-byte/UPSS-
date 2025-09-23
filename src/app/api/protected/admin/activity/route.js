// /app/api/protected/admin/activity/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Require school admin authentication
    const user = await requireAuth(['admin']);
    
    // Ensure user has a school association and school exists
    if (!user.schoolId || !user.school) {
      return NextResponse.json(
        { error: 'User not associated with any school' },
        { status: 400 }
      );
    }

    // Verify the school is active
    if (!user.school.isActive) {
      return NextResponse.json(
        { error: 'School is not active' },
        { status: 403 }
      );
    }

    // Verify user is actually an admin of this school
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied - admin role required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;

    const schoolId = user.schoolId;

    // Fetch recent activity from audit logs for this school only
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        user: {
          schoolId: schoolId,
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get other activity sources from this school only
    const [recentLogins, recentAssignments, recentGrades] = await Promise.all([
      // Recent logins
      prisma.user.findMany({
        where: {
          schoolId: schoolId,
          isActive: true,
          lastLogin: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          lastLogin: true,
          avatar: true
        },
        orderBy: {
          lastLogin: 'desc'
        },
        take: 10
      }),

      // Recent assignments created
      prisma.assignment.findMany({
        where: {
          schoolId: schoolId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          subject: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),

      // Recent grades entered
      prisma.grade.findMany({
        where: {
          schoolId: schoolId,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          student: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          subject: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    // Format activities
    const activities = [];

    // Add audit log activities
    auditLogs.forEach(log => {
      activities.push({
        id: log.id,
        type: 'system',
        user: `${log.user.firstName} ${log.user.lastName}`,
        userInitials: `${log.user.firstName.charAt(0)}${log.user.lastName.charAt(0)}`,
        userRole: log.user.role,
        userAvatar: log.user.avatar,
        description: log.description || `${log.action} on ${log.resource}`,
        timestamp: log.createdAt,
        metadata: log.metadata
      });
    });

    // Add recent login activities
    recentLogins.forEach(login => {
      activities.push({
        id: `login-${login.id}`,
        type: 'login',
        user: `${login.firstName} ${login.lastName}`,
        userInitials: `${login.firstName.charAt(0)}${login.lastName.charAt(0)}`,
        userRole: login.role,
        userAvatar: login.avatar,
        description: `${login.role} logged into the system`,
        timestamp: login.lastLogin,
        metadata: { action: 'login' }
      });
    });

    // Add assignment activities
    recentAssignments.forEach(assignment => {
      activities.push({
        id: `assignment-${assignment.id}`,
        type: 'assignment',
        user: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
        userInitials: `${assignment.teacher.firstName.charAt(0)}${assignment.teacher.lastName.charAt(0)}`,
        userRole: 'teacher',
        userAvatar: assignment.teacher.avatar,
        description: `Created assignment "${assignment.title}" for ${assignment.subject.name}`,
        timestamp: assignment.createdAt,
        metadata: { 
          action: 'create_assignment', 
          subject: assignment.subject.name,
          classes: assignment.classes
        }
      });
    });

    // Add grade activities
    recentGrades.forEach(grade => {
      activities.push({
        id: `grade-${grade.id}`,
        type: 'grade',
        user: `${grade.teacher.firstName} ${grade.teacher.lastName}`,
        userInitials: `${grade.teacher.firstName.charAt(0)}${grade.teacher.lastName.charAt(0)}`,
        userRole: 'teacher',
        userAvatar: grade.teacher.avatar,
        description: `Graded ${grade.student.firstName} ${grade.student.lastName} in ${grade.subject.name} - ${grade.score}/${grade.maxScore}`,
        timestamp: grade.createdAt,
        metadata: { 
          action: 'grade_student', 
          subject: grade.subject.name,
          score: grade.score,
          maxScore: grade.maxScore
        }
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Take only the requested number
    const limitedActivities = activities.slice(0, limit);

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
      total: activities.length,
      hasMore: activities.length > limit,
      school: {
        id: user.school.id,
        name: user.school.name
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied - admin privileges required' },
        { status: 403 }
      );
    }

    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}