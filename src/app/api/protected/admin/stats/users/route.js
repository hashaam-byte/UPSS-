// /app/api/protected/admin/stats/users/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);

    // Get user statistics for the admin's school
    const [totalUsers, students, teachers, admins, activeUsers] = await Promise.all([
      prisma.user.count({
        where: { 
          schoolId: user.school.id,
          isActive: true 
        }
      }),
      prisma.user.count({
        where: { 
          schoolId: user.school.id,
          role: 'student',
          isActive: true 
        }
      }),
      prisma.user.count({
        where: { 
          schoolId: user.school.id,
          role: 'teacher',
          isActive: true 
        }
      }),
      prisma.user.count({
        where: { 
          schoolId: user.school.id,
          role: 'admin',
          isActive: true 
        }
      }),
      prisma.user.count({
        where: { 
          schoolId: user.school.id,
          isActive: true,
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalUsers,
        students,
        teachers,
        admins,
        active: activeUsers
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

    console.error('Get user stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
