
// /app/api/protected/admin/stats/activity/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);

    // Get recent activities for the school
    const recentUsers = await prisma.user.findMany({
      where: { 
        schoolId: user.school.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const activities = recentUsers.map(user => ({
      id: user.id,
      description: `New ${user.role} account created: ${user.firstName} ${user.lastName}`,
      timestamp: user.createdAt.toISOString(),
      type: 'user_created'
    }));

    return NextResponse.json({
      success: true,
      activities
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

    console.error('Get activity stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}