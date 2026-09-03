// /app/api/protected/teacher/class/notifications/count/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Unread notification count for the class teacher (used by the sidebar badge)
export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);

    const count = await prisma.notification.count({
      where: {
        userId: user.id,
        schoolId: user.schoolId,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Class teacher notification count error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
