
// /app/api/protected/admin/messages/send/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await requireAuth(['admin']);
    const { conversationId, content } = await request.json();

    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Conversation ID and content are required' },
        { status: 400 }
      );
    }

    // Verify the other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: conversationId },
      select: { id: true, firstName: true, lastName: true, role: true }
    });

    if (!otherUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        fromUserId: user.id,
        toUserId: conversationId,
        isRead: false
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
      }
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        isRead: message.isRead,
        fromCurrentUser: true,
        sender: {
          id: message.fromUser.id,
          name: `${message.fromUser.firstName} ${message.fromUser.lastName}`,
          role: message.fromUser.role
        }
      }
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

    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
