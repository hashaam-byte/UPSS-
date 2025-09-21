// /app/api/protected/teacher/coordinator/notifications/recent/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify coordinator access
async function verifyCoordinatorAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { teacherProfile: true }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'coordinator') {
    throw new Error('Access denied');
  }

  return user;
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const coordinator = await verifyCoordinatorAccess(token);

    // Get recent notifications (last 5 unread + 5 most recent)
    const recentNotifications = await prisma.notification.findMany({
      where: {
        userId: coordinator.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: coordinator.id,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications: recentNotifications,
        unreadCount
      }
    });

  } catch (error) {
    console.error('Recent notifications error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}