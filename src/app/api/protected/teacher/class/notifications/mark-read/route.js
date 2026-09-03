// /app/api/protected/teacher/class/notifications/mark-read/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT - Mark a single notification (or all) as read
export async function PUT(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const body = await request.json();
    const { notificationId } = body;

    const whereCondition = notificationId
      ? { id: notificationId, userId: user.id, schoolId: user.schoolId }
      : { userId: user.id, schoolId: user.schoolId, isRead: false };

    const result = await prisma.notification.updateMany({
      where: whereCondition,
      data: { isRead: true, readAt: new Date() }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} notification(s) marked as read`,
      data: { updatedCount: result.count }
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
