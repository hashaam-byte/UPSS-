
// /app/api/protected/students/messages/send/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await requireAuth(['student']);
    const body = await request.json();
    const { conversationId, content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        fromUserId: user.id,
        toUserId: conversationId,
        schoolId: user.schoolId,
        content: content.trim(),
        messageType: 'direct'
      }
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: conversationId,
        schoolId: user.schoolId,
        title: 'New Message',
        content: `You have a new message from ${user.firstName} ${user.lastName}`,
        type: 'info',
        actionUrl: '/protected/teacher/messages'
      }
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        fromCurrentUser: true,
        isRead: false,
        createdAt: message.createdAt
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}