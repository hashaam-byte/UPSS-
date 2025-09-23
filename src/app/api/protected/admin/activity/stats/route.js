// /app/api/protected/admin/stats/activity/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);

    // Fetch recent activity from AuditLog table
    const activities = await prisma.auditLog.findMany({
      where: {
        userId: user.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      activities: activities.map(a => ({
        id: a.id,
        description: a.description || `${a.action} on ${a.resource}`,
        timestamp: a.createdAt,
        type: a.action
      }))
    });

  } catch (error) {
    console.error('Get activity stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}