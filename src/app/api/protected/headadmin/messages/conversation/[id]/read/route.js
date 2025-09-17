// pages/api/protected/headadmin/messages/conversations/[id]/read.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = params;
    const [schoolId, userId] = id.split('-');

    // Mark all messages from this user as read
    await prisma.message.updateMany({
      where: {
        fromUserId: userId,
        toUserId: user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    
