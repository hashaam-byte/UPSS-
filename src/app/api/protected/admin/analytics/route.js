// /app/api/protected/admin/analytics/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Require school admin authentication
    const user = await requireAuth(['ADMIN']);
    
    // The requireAuth function now handles the school verification
    // Just double-check we have the school data
    if (!user.school || !user.school.isActive) {
      return NextResponse.json(
        { error: 'School not found or inactive' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    let startDate;
    const endDate = new Date();
    
    switch (range) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // All queries STRICTLY filtered by this admin's school ONLY
    const schoolId = user.schoolId;
    
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      userGrowthData,
      loginRateData,
      studentPerformanceData,
      teacherActivityData,
      resourceCount,
      attendanceStats,
      dailyActiveUsers,
      previousPeriodActive,
      gradingStats,
    ] = await Promise.all([
      // Total users in THIS SCHOOL only
      prisma.user.count({
        where: { 
          schoolId: schoolId,
          isActive: true
        }
      }),
      
      // Active users in THIS SCHOOL only (logged in within the time range)
      prisma.user.count({
        where: {
          schoolId: schoolId,
          isActive: true,
          lastLogin: {
            gte: startDate
          }
        }
      }),
      
      // New users this month in THIS SCHOOL only
      prisma.user.count({
        where: {
          schoolId: schoolId,
          isActive: true,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // User growth over time in THIS SCHOOL only
      prisma.user.findMany({
        where: {
          schoolId: schoolId,
          isActive: true,
          createdAt: {
            gte: startDate
          }
        },
        select: {
          createdAt: true,
          role: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }),
      
      // Login rate calculation for THIS SCHOOL only
      prisma.user.count({
        where: {
          schoolId: schoolId,
          isActive: true,
          lastLogin: {
            not: null
          }
        }
      }),

      // Student performance metrics for THIS SCHOOL only
      prisma.studentPerformanceMetrics.aggregate({
        where: {
          schoolId: schoolId
        },
        _avg: {
          overallGPA: true,
          attendanceRate: true,
          assignmentCompletion: true
        },
        _count: {
          id: true
        }
      }),

      // Teacher activity for THIS SCHOOL only
      prisma.user.count({
        where: {
          schoolId: schoolId,
          role: 'TEACHER',
          isActive: true,
          lastLogin: {
            gte: startDate
          }
        }
      }),

      // Resource uploads for THIS SCHOOL only (was mislabeled — previously counted
      // Assignment records and called them "resourceUploads")
      prisma.resource.count({
        where: {
          schoolId: schoolId,
          createdAt: { gte: startDate }
        }
      }),

      // Attendance statistics for THIS SCHOOL only
      prisma.attendance.aggregate({
        where: {
          schoolId: schoolId,
          date: {
            gte: startDate
          }
        },
        _count: {
          id: true
        }
      }),

      // Real daily active users — logged in within the last 24 hours
      // (previously this was activeUsers * 0.85, a fabricated number)
      prisma.user.count({
        where: {
          schoolId: schoolId,
          isActive: true,
          lastLogin: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),

      // Users active in the PRIOR period of equal length, for a real retention
      // calculation (previously userRetentionRate was an invented formula)
      prisma.user.count({
        where: {
          schoolId: schoolId,
          isActive: true,
          lastLogin: {
            gte: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())),
            lt: startDate
          }
        }
      }),

      // Real grading timeliness: submissions graded within 7 days of their
      // due date, vs all graded submissions (previously gradingTimeliness
      // was a hardcoded 85 with a comment admitting it wasn't real)
      prisma.assignmentSubmission.findMany({
        where: {
          assignment: { schoolId },
          gradedAt: { not: null, gte: startDate },
        },
        select: { gradedAt: true, assignment: { select: { dueDate: true } } },
      })
    ]);
    const loginRate = totalUsers > 0 ? Math.round((loginRateData / totalUsers) * 100) : 0;

    // Real retention: of the users active in the prior period, what
    // fraction are still active now? 0 when there's no prior-period data
    // to compare against, rather than a fabricated placeholder.
    const userRetentionRate = previousPeriodActive > 0
      ? Math.round((activeUsers / previousPeriodActive) * 100)
      : null;

    const gradedOnTime = gradingStats.filter(s => s.assignment?.dueDate && s.gradedAt && (s.gradedAt.getTime() - new Date(s.assignment.dueDate).getTime()) <= 7 * 24 * 60 * 60 * 1000).length;
    const gradingTimeliness = gradingStats.length > 0 ? Math.round((gradedOnTime / gradingStats.length) * 100) : null;

    // Process user growth data (group by day/week based on range)
    const userGrowth = processUserGrowthData(userGrowthData, range);

    // Activity data (filtered by THIS SCHOOL only)
    const activityData = await generateActivityData(schoolId, startDate, endDate);

    // Performance metrics with real data from THIS SCHOOL only
    const performanceMetrics = {
      dailyActiveUsers,
      averageSessionDuration: null, // not tracked yet — no session start/end data exists to compute this honestly
      userRetentionRate,

      // Academic performance metrics
      averageGrade: studentPerformanceData._avg.overallGPA 
        ? Math.round(studentPerformanceData._avg.overallGPA * 20) // Convert GPA to percentage
        : 0,
      assignmentCompletionRate: studentPerformanceData._avg.assignmentCompletion || 0,
      attendanceRate: studentPerformanceData._avg.attendanceRate || 0,
      
      // Teacher metrics
      activeTeachers: teacherActivityData,
      gradingTimeliness,
      resourceUploads: resourceCount
    };

    return NextResponse.json({
      success: true,
      analytics: {
        overview: {
          totalUsers,
          activeUsers,
          newUsersThisMonth,
          loginRate
        },
        userGrowth,
        activityData,
        performanceMetrics,
        school: {
          id: user.school.id,
          name: user.school.name
        }
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

    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function processUserGrowthData(userData, range) {
  const groups = {};
  
  userData.forEach(user => {
    let key;
    const date = new Date(user.createdAt);
    
    if (range === '7d' || range === '30d') {
      key = date.toISOString().split('T')[0];
    } else if (range === '3m' || range === '6m') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { students: 0, teachers: 0, admins: 0, total: 0 };
    }
    
    groups[key][user.role === 'STUDENT' ? 'students' : user.role === 'TEACHER' ? 'teachers' : 'admins']++;
    groups[key].total++;
  });
  
  return Object.entries(groups).map(([date, counts]) => ({
    date,
    ...counts
  }));
}

async function generateActivityData(schoolId, startDate, endDate) {
  // Get activity data ONLY for this specific school
  const loginData = await prisma.user.findMany({
    where: {
      schoolId: schoolId, // Explicit school filtering
      isActive: true,
      lastLogin: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      lastLogin: true,
      role: true
    }
  });

  const dailyActivity = {};
  
  loginData.forEach(user => {
    if (user.lastLogin) {
      const date = user.lastLogin.toISOString().split('T')[0];
      const hour = user.lastLogin.getHours();
      const key = `${date}-${hour}`;
      
      if (!dailyActivity[key]) {
        dailyActivity[key] = {
          date,
          hour,
          users: 0,
          students: 0,
          teachers: 0,
          day: user.lastLogin.toLocaleDateString('en-US', { weekday: 'long' })
        };
      }
      
      dailyActivity[key].users++;
      if (user.role === 'STUDENT') {
        dailyActivity[key].students++;
      } else if (user.role === 'TEACHER') {
        dailyActivity[key].teachers++;
      }
    }
  });

  return Object.values(dailyActivity)
    .sort((a, b) => `${a.date}-${a.hour}`.localeCompare(`${b.date}-${b.hour}`))
    .slice(0, 24);
}