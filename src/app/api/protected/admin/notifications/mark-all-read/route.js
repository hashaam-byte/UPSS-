// /app/api/protected/admin/notifications/mark-all-read/route.js
// This route was called by the frontend but never existed — "Mark all
// as read" silently did nothing (404, uncaught by the caller).
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH() {
  try {
    const user = await requireAuth(['ADMIN']);

    const result = await prisma.notification.updateMany({
      where: {
        isRead: false,
        OR: [
          { userId: user.id },
          { schoolId: user.school.id, isGlobal: false },
          { isGlobal: true }
        ]
      },
      data: { isRead: true, readAt: new Date() }
    });

    return NextResponse.json({ success: true, updatedCount: result.count });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Mark all notifications read error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
