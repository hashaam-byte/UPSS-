
// /app/api/protected/admin/messages/[conversationId]/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['admin']);
    const { conversationId } = params;

    // Get messages for the conversation
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            fromUserId: user.id,
            toUserId: conversationId
          },
          {
            fromUserId: conversationId,
            toUserId: user.id
          }
        ]
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        fromUserId: conversationId,
        toUserId: user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      isRead: message.isRead,
      fromCurrentUser: message.fromUserId === user.id,
      sender: {
        id: message.fromUser.id,
        name: `${message.fromUser.firstName} ${message.fromUser.lastName}`,
        role: message.fromUser.role
      }
    }));

    return NextResponse.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
