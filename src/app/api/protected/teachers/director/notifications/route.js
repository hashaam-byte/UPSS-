// /app/api/protected/teachers/director/notifications/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get current user and verify they're a director
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is a teacher with director department
    const isDirector = user.role === 'teacher' && 
                      (user.department === 'director' || 
                       user.profile?.department === 'director');

    if (!isDirector) {
      return NextResponse.json(
        { error: 'Director access required' },
        { status: 403 }
      );
    }

    // Get notifications for this user
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: user.id },
          { 
            AND: [
              { schoolId: user.school?.id },
              { isGlobal: false }
            ]
          },
          { isGlobal: true }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      success: true,
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        isRead: notification.isRead,
        readAt: notification.readAt,
        actionUrl: notification.actionUrl,
        actionText: notification.actionText,
        createdAt: notification.createdAt
      }))
    });

  } catch (error) {
    console.error('Director notifications API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}