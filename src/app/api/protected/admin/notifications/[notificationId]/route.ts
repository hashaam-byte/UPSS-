// app/api/protected/admin/notifications/[notificationId]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { notificationId } = await context.params;

    // Update notification as read
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        OR: [
          { userId: user.id },
          { schoolId: user.schoolId, isGlobal: false },
          { isGlobal: true }
        ]
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}

// Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['admin']);

    await prisma.notification.updateMany({
      where: {
        OR: [
          { userId: user.id },
          { schoolId: user.schoolId, isGlobal: false }
        ],
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}