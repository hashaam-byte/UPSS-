// app/api/protected/teachers/director/notifications/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const whereClause = {
      userId: user.id,
      ...(unreadOnly && { isRead: false })
    };

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        priority: true,
        isRead: true,
        readAt: true,
        actionUrl: true,
        actionText: true,
        createdAt: true
      }
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { notificationId, markAllAsRead } = await request.json();

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
        userId: user.id
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID required' },
        { status: 400 }
      );
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}