

// /app/api/protected/admin/notifications/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);

    // Get notifications for the user and school
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { schoolId: user.school.id, isGlobal: false },
          { isGlobal: true }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        createdAt: notification.createdAt
      }))
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

    console.error('Get notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}