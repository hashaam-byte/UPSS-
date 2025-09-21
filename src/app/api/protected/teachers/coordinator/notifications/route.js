
// /app/api/protected/teacher/coordinator/notifications/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // Verify user is a coordinator
    const coordinator = await prisma.user.findFirst({
      where: {
        id: user.id,
        teacherProfile: {
          department: 'coordinator'
        }
      }
    });

    if (!coordinator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    const where = {
      userId: user.id
    };

    if (filter === 'unread') {
      where.isRead = false;
    } else if (filter && filter !== 'all') {
      where.type = filter;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      data: { notifications }
    });

  } catch (error) {
    console.error('Coordinator notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['teacher']);
    const { action, notificationIds } = await request.json();

    // Verify user is a coordinator
    const coordinator = await prisma.user.findFirst({
      where: {
        id: user.id,
        teacherProfile: {
          department: 'coordinator'
        }
      }
    });

    if (!coordinator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'mark_read' && notificationIds) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } else if (action === 'mark_all_read') {
      await prisma.notification.updateMany({
        where: { userId: user.id },
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
    console.error('Coordinator notifications POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth(['teacher']);
    const { notificationIds } = await request.json();

    // Verify user is a coordinator
    const coordinator = await prisma.user.findFirst({
      where: {
        id: user.id,
        teacherProfile: {
          department: 'coordinator'
        }
      }
    });

    if (!coordinator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notifications deleted successfully'
    });

  } catch (error) {
    console.error('Coordinator notifications DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
