// pages/api/protected/headadmin/messages/conversations/[id].js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
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

    // Get messages between head admin and school admin
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: user.id, toUserId: userId },
          { fromUserId: userId, toUserId: user.id }
        ]
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
 