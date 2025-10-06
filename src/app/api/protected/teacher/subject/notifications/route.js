// app/api/protected/teacher/subject/notifications/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher' || user.department !== 'subject_teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const read = searchParams.get('read');

    const where = {
      userId: user.id
    };

    if (read === 'false') {
      where.isRead = false;
    } else if (read === 'true') {
      where.isRead = true;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const unreadTotal = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    const summary = {
      unreadTotal,
      byType: {
        assignment_submission: await prisma.notification.count({
          where: { userId: user.id, isRead: false, type: 'assignment_submission' }
        }),
        message: await prisma.notification.count({
          where: { userId: user.id, isRead: false, type: 'message' }
        }),
        alert: await prisma.notification.count({
          where: { userId: user.id, isRead: false, type: 'alert' }
        })
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        summary
      }
    });

  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Mark notification as read
export async function PATCH(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { notificationId } = await request.json();

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: user.id
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}

// Mark all as read
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { action } = await request.json();

    if (action === 'mark_all_read') {
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

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Notification action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process action' },
      { status: 500 }
    );
  }
}

// Delete notification
export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: user.id
      }
    });

    return NextResponse.json({ success: true, message: 'Notification deleted' });

  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}