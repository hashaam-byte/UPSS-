
// /app/api/protected/students/messages/[conversationId]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['student']);
    const { conversationId } = params;

    // Fetch messages between student and the other user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: user.id, toUserId: conversationId },
          { fromUserId: conversationId, toUserId: user.id }
        ],
        schoolId: user.schoolId
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

    // Transform messages
    const transformedMessages = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      fromCurrentUser: msg.fromUserId === user.id,
      isRead: msg.isRead,
      createdAt: msg.createdAt
    }));

    return NextResponse.json({
      success: true,
      messages: transformedMessages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
