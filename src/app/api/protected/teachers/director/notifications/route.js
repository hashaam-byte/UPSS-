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
    const limit = parseInt(searchParams.get('limit')) || 50;
    const type = searchParams.get('type'); // filter by type
    const priority = searchParams.get('priority'); // filter by priority

    let whereClause = {
      userId: user.id,
      schoolId: user.schoolId
    };

    if (type) {
      whereClause.type = type;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount
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

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          schoolId: user.schoolId,
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

    if (notificationId) {
      // Mark specific notification as read
      const notification = await prisma.notification.findFirst({
        where: {
          id: notificationId,
          userId: user.id,
          schoolId: user.schoolId
        }
      });

      if (!notification) {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        );
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Notification marked as read'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notification update error:', error);
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

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId: user.id,
        schoolId: user.schoolId
      }
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Notification delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

// POST - Create notification (for system-generated notifications)
export async function POST(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId, title, content, type = 'info', priority = 'normal', actionUrl, actionText } = body;

    // Verify target user exists in same school
    if (targetUserId) {
      const targetUser = await prisma.user.findFirst({
        where: {
          id: targetUserId,
          schoolId: user.schoolId,
          isActive: true
        }
      });

      if (!targetUser) {
        return NextResponse.json(
          { success: false, error: 'Target user not found' },
          { status: 404 }
        );
      }

      // Create notification
      const notification = await prisma.notification.create({
        data: {
          userId: targetUserId,
          schoolId: user.schoolId,
          title,
          content,
          type,
          priority,
          actionUrl,
          actionText,
          isRead: false
        }
      });

      return NextResponse.json({
        success: true,
        data: { notification },
        message: 'Notification created successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Target user ID required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notification create error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}