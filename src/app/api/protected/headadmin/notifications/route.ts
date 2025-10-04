// app/api/protected/headadmin/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['headadmin']);
    
    if (!authResult.authenticated || authResult.user?.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    // Fetch notifications for head admin (global notifications)
    const notifications = await prisma.notification.findMany({
      where: {
        isGlobal: true,
        ...(unreadOnly ? { isRead: false } : {})
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        isGlobal: true,
        isRead: false
      }
    });

    return NextResponse.json({
      notifications: notifications,
      unreadCount: unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Mark notification as read
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['headadmin']);
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const body = await request.json();
    const { notificationId, markAllRead } = body;

    if (markAllRead) {
      // Mark all global notifications as read
      await prisma.notification.updateMany({
        where: {
          isGlobal: true,
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
      await prisma.notification.update({
        where: {
          id: notificationId
        },
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
      { error: 'Either notificationId or markAllRead must be provided' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}