// /app/api/protected/admin/activity/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Require school admin authentication
    const user = await requireAuth(['admin']);
    
    // Verify school association and active status
    if (!user.school || !user.school.isActive) {
      return NextResponse.json(
        { error: 'School not found or inactive' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const days = parseInt(searchParams.get('days')) || 7;

    const schoolId = user.schoolId;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch all types of activities from this school
    const [
      auditLogs,
      recentLogins,
      recentAssignments,
      recentSubmissions,
      recentGrades,
      recentAttendance,
      recentAlerts,
      recentAnnouncements,
      recentRegistrations
    ] = await Promise.all([
      // System audit logs
      prisma.auditLog.findMany({
        where: {
          user: {
            schoolId: schoolId,
            isActive: true
          },
          createdAt: {
            gte: startDate
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
        take: 10
      }),

      // Recent user logins
      prisma.user.findMany({
        where: {
          schoolId: schoolId,
          isActive: true,
          lastLogin: {
            gte: startDate
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
        take: 15
      }),

      // Recent assignments created
      prisma.assignment.findMany({
        where: {
          schoolId: schoolId,
          createdAt: {
            gte: startDate
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

      // Recent assignment submissions
      prisma.assignmentSubmission.findMany({
        where: {
          schoolId: schoolId,
          submittedAt: {
            gte: startDate
          }
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          },
          assignment: {
            select: {
              title: true,
              subject: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          submittedAt: 'desc'
        },
        take: 10
      }),

      // Recent grades entered
      prisma.grade.findMany({
        where: {
          schoolId: schoolId,
          createdAt: {
            gte: startDate
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
      }),

      // Recent attendance records
      prisma.attendance.findMany({
        where: {
          schoolId: schoolId,
          date: {
            gte: startDate
          }
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          marker: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          markedAt: 'desc'
        },
        take: 10
      }),

      // Recent student alerts
      prisma.studentAlert.findMany({
        where: {
          schoolId: schoolId,
          createdAt: {
            gte: startDate
          }
        },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          creator: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }),

      // Recent announcements
      prisma.announcement.findMany({
        where: {
          schoolId: schoolId,
          createdAt: {
            gte: startDate
          }
        },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      }),

      // Recent user registrations
      prisma.user.findMany({
        where: {
          schoolId: schoolId,
          createdAt: {
            gte: startDate
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ]);

    // Combine and format all activities
    const activities = [];

    // Add audit log activities
    auditLogs.forEach(log => {
      activities.push({
        id: `audit-${log.id}`,
        type: 'system',
        category: 'audit',
        user: `${log.user.firstName} ${log.user.lastName}`,
        userInitials: `${log.user.firstName.charAt(0)}${log.user.lastName.charAt(0)}`,
        userRole: log.user.role,
        userAvatar: log.user.avatar,
        description: log.description || `${log.action} on ${log.resource}`,
        timestamp: log.createdAt,
        metadata: {
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          ...log.metadata
        }
      });
    });

    // Add login activities
    recentLogins.forEach(login => {
      activities.push({
        id: `login-${login.id}-${login.lastLogin}`,
        type: 'auth',
        category: 'login',
        user: `${login.firstName} ${login.lastName}`,
        userInitials: `${login.firstName.charAt(0)}${login.lastName.charAt(0)}`,
        userRole: login.role,
        userAvatar: login.avatar,
        description: `${login.role === 'student' ? 'Student' : login.role === 'teacher' ? 'Teacher' : 'Administrator'} logged into the system`,
        timestamp: login.lastLogin,
        metadata: { 
          action: 'login',
          userId: login.id
        }
      });
    });

    // Add assignment activities
    recentAssignments.forEach(assignment => {
      activities.push({
        id: `assignment-${assignment.id}`,
        type: 'academic',
        category: 'assignment',
        user: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
        userInitials: `${assignment.teacher.firstName.charAt(0)}${assignment.teacher.lastName.charAt(0)}`,
        userRole: 'teacher',
        userAvatar: assignment.teacher.avatar,
        description: `Created assignment "${assignment.title}" for ${assignment.subject.name}`,
        timestamp: assignment.createdAt,
        metadata: { 
          action: 'create_assignment',
          assignmentId: assignment.id,
          subject: assignment.subject.name,
          classes: assignment.classes,
          dueDate: assignment.dueDate
        }
      });
    });

    // Add submission activities
    recentSubmissions.forEach(submission => {
      activities.push({
        id: `submission-${submission.id}`,
        type: 'academic',
        category: 'submission',
        user: `${submission.student.firstName} ${submission.student.lastName}`,
        userInitials: `${submission.student.firstName.charAt(0)}${submission.student.lastName.charAt(0)}`,
        userRole: 'student',
        userAvatar: submission.student.avatar,
        description: `Submitted assignment "${submission.assignment.title}" for ${submission.assignment.subject.name}`,
        timestamp: submission.submittedAt,
        metadata: { 
          action: 'submit_assignment',
          submissionId: submission.id,
          assignmentTitle: submission.assignment.title,
          subject: submission.assignment.subject.name,
          isLate: submission.isLateSubmission
        }
      });
    });

    // Add grading activities
    recentGrades.forEach(grade => {
      activities.push({
        id: `grade-${grade.id}`,
        type: 'academic',
        category: 'grading',
        user: `${grade.teacher.firstName} ${grade.teacher.lastName}`,
        userInitials: `${grade.teacher.firstName.charAt(0)}${grade.teacher.lastName.charAt(0)}`,
        userRole: 'teacher',
        userAvatar: grade.teacher.avatar,
        description: `Graded ${grade.student.firstName} ${grade.student.lastName} in ${grade.subject.name} - ${grade.score}/${grade.maxScore} (${grade.percentage}%)`,
        timestamp: grade.createdAt,
        metadata: { 
          action: 'grade_student',
          gradeId: grade.id,
          subject: grade.subject.name,
          score: grade.score,
          maxScore: grade.maxScore,
          percentage: grade.percentage,
          assessmentType: grade.assessmentType
        }
      });
    });

    // Add attendance activities
    recentAttendance.forEach(attendance => {
      const statusText = attendance.status === 'present' ? 'Present' : 
                        attendance.status === 'absent' ? 'Absent' : 
                        attendance.status === 'late' ? 'Late' : 
                        attendance.status === 'excused' ? 'Excused' : 'Partial';
      
      activities.push({
        id: `attendance-${attendance.id}`,
        type: 'attendance',
        category: 'attendance',
        user: `${attendance.marker.firstName} ${attendance.marker.lastName}`,
        userInitials: `${attendance.marker.firstName.charAt(0)}${attendance.marker.lastName.charAt(0)}`,
        userRole: 'teacher',
        userAvatar: attendance.marker.avatar,
        description: `Marked ${attendance.student.firstName} ${attendance.student.lastName} as ${statusText}`,
        timestamp: attendance.markedAt,
        metadata: { 
          action: 'mark_attendance',
          attendanceId: attendance.id,
          studentName: `${attendance.student.firstName} ${attendance.student.lastName}`,
          status: attendance.status,
          date: attendance.date,
          period: attendance.period
        }
      });
    });

    // Add alert activities
    recentAlerts.forEach(alert => {
      activities.push({
        id: `alert-${alert.id}`,
        type: 'alert',
        category: 'student_alert',
        user: `${alert.creator.firstName} ${alert.creator.lastName}`,
        userInitials: `${alert.creator.firstName.charAt(0)}${alert.creator.lastName.charAt(0)}`,
        userRole: 'teacher',
        userAvatar: alert.creator.avatar,
        description: `Created ${alert.alertType.replace('_', ' ')} alert for ${alert.student.firstName} ${alert.student.lastName}: ${alert.title}`,
        timestamp: alert.createdAt,
        metadata: { 
          action: 'create_alert',
          alertId: alert.id,
          alertType: alert.alertType,
          studentName: `${alert.student.firstName} ${alert.student.lastName}`,
          priority: alert.priority,
          status: alert.status
        }
      });
    });

    // Add announcement activities
    recentAnnouncements.forEach(announcement => {
      activities.push({
        id: `announcement-${announcement.id}`,
        type: 'communication',
        category: 'announcement',
        user: `${announcement.creator.firstName} ${announcement.creator.lastName}`,
        userInitials: `${announcement.creator.firstName.charAt(0)}${announcement.creator.lastName.charAt(0)}`,
        userRole: 'admin',
        userAvatar: announcement.creator.avatar,
        description: `Published announcement: "${announcement.title}"`,
        timestamp: announcement.createdAt,
        metadata: { 
          action: 'create_announcement',
          announcementId: announcement.id,
          title: announcement.title,
          targetAudience: announcement.targetAudience,
          isUrgent: announcement.isUrgent,
          status: announcement.status
        }
      });
    });

    // Add registration activities
    recentRegistrations.forEach(registration => {
      activities.push({
        id: `registration-${registration.id}`,
        type: 'user',
        category: 'registration',
        user: `${registration.firstName} ${registration.lastName}`,
        userInitials: `${registration.firstName.charAt(0)}${registration.lastName.charAt(0)}`,
        userRole: registration.role,
        userAvatar: registration.avatar,
        description: `New ${registration.role} joined the school`,
        timestamp: registration.createdAt,
        metadata: { 
          action: 'user_registration',
          userId: registration.id,
          role: registration.role
        }
      });
    });

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    // Calculate statistics
    const stats = {
      total: activities.length,
      byType: activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {}),
      byCategory: activities.reduce((acc, activity) => {
        acc[activity.category] = (acc[activity.category] || 0) + 1;
        return acc;
      }, {}),
      byRole: activities.reduce((acc, activity) => {
        acc[activity.userRole] = (acc[activity.userRole] || 0) + 1;
        return acc;
      }, {}),
      mostActiveUsers: Object.entries(
        activities.reduce((acc, activity) => {
          const key = `${activity.user}-${activity.userRole}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {})
      ).sort(([,a], [,b]) => b - a).slice(0, 5).map(([user, count]) => {
        const [name, role] = user.split('-');
        return { user: name, role, activityCount: count };
      })
    };

    return NextResponse.json({
      success: true,
      activities: paginatedActivities,
      pagination: {
        total: activities.length,
        limit,
        offset,
        hasMore: activities.length > offset + limit,
        currentPage: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(activities.length / limit)
      },
      stats,
      filters: {
        days,
        types: Object.keys(stats.byType),
        categories: Object.keys(stats.byCategory)
      },
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