// /app/api/protected/students/notifications/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const read = searchParams.get('read');

    // Build where clause
    const whereClause = {
      OR: [
        { userId: user.id },
        { isGlobal: true },
        { schoolId: user.schoolId, isGlobal: false, userId: null }
      ]
    };

    if (read !== null) {
      whereClause.isRead = read === 'true';
    }

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get unread count by type
    const unreadCounts = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        ...whereClause,
        isRead: false
      },
      _count: {
        id: true
      }
    });

    const summary = {
      unreadTotal: unreadCounts.reduce((sum, item) => sum + item._count.id, 0),
      unreadByType: unreadCounts.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {})
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        summary
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['student']);
    const body = await request.json();
    const { notificationId, markAsRead } = body;

    if (notificationId) {
      // Mark single notification
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          OR: [
            { userId: user.id },
            { isGlobal: true },
            { schoolId: user.schoolId, userId: null }
          ]
        },
        data: {
          isRead: markAsRead !== false,
          readAt: markAsRead !== false ? new Date() : null
        }
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          OR: [
            { userId: user.id },
            { isGlobal: true },
            { schoolId: user.schoolId, userId: null }
          ],
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications updated successfully'
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}