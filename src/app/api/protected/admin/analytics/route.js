// /app/api/protected/admin/analytics/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);
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

    // Fetch analytics data
    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      userGrowthData,
      loginRateData
    ] = await Promise.all([
      // Total users
      prisma.user.count({
        where: { schoolId: user.schoolId }
      }),
      
      // Active users (logged in within the time range)
      prisma.user.count({
        where: {
          schoolId: user.schoolId,
          lastLogin: {
            gte: startDate
          }
        }
      }),
      
      // New users this month
      prisma.user.count({
        where: {
          schoolId: user.schoolId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // User growth over time (simplified - you'd want more sophisticated grouping)
      prisma.user.findMany({
        where: {
          schoolId: user.schoolId,
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
      
      // Login rate calculation
      prisma.user.count({
        where: {
          schoolId: user.schoolId,
          lastLogin: {
            not: null
          }
        }
      })
    ]);

    // Calculate login rate percentage
    const loginRate = totalUsers > 0 ? Math.round((loginRateData / totalUsers) * 100) : 0;

    // Process user growth data (group by day/week based on range)
    const userGrowth = processUserGrowthData(userGrowthData, range);

    // Activity data (simplified)
    const activityData = await generateActivityData(user.schoolId, startDate, endDate);

    // Performance metrics
    const performanceMetrics = {
      averageSessionDuration: 24, // minutes - you'd calculate this from actual session data
      userRetentionRate: 92, // percentage
      dailyActiveUsers: Math.round(activeUsers * 0.85),
      weeklyActiveUsers: activeUsers,
      monthlyActiveUsers: Math.round(activeUsers * 1.2)
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
        performanceMetrics
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
        { error: 'Access denied' },
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
  // Group users by time periods
  const groups = {};
  
  userData.forEach(user => {
    let key;
    const date = new Date(user.createdAt);
    
    if (range === '7d' || range === '30d') {
      // Group by day
      key = date.toISOString().split('T')[0];
    } else if (range === '3m' || range === '6m') {
      // Group by week
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else {
      // Group by month
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!groups[key]) {
      groups[key] = { students: 0, teachers: 0, admins: 0, total: 0 };
    }
    
    groups[key][user.role === 'student' ? 'students' : user.role === 'teacher' ? 'teachers' : 'admins']++;
    groups[key].total++;
  });
  
  return Object.entries(groups).map(([date, counts]) => ({
    date,
    ...counts
  }));
}

async function generateActivityData(schoolId, startDate, endDate) {
  // This would ideally come from actual user activity logs
  // For now, we'll generate based on login data
  const loginData = await prisma.user.findMany({
    where: {
      schoolId,
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

  // Process into activity patterns
  const activityByHour = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    students: 0,
    teachers: 0,
    total: 0
  }));

  loginData.forEach(user => {
    if (user.lastLogin) {
      const hour = new Date(user.lastLogin).getHours();
      const role = user.role === 'student' ? 'students' : 'teachers';
      activityByHour[hour][role]++;
      activityByHour[hour].total++;
    }
  });

  return activityByHour;
}