// app/api/protected/admin/messages/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth(['admin']);
    const { conversationId } = await context.params;

    let messages;

    if (conversationId === 'headadmin') {
      // Messages with head admin (fromUserId is null for head admin messages)
      messages = await prisma.message.findMany({
        where: {
          schoolId: user.schoolId,
          OR: [
            { fromUserId: null, toUserId: user.id },
            { fromUserId: user.id, toUserId: null }
          ]
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          fromUserId: true,
          toUserId: true,
          createdAt: true,
          isRead: true,
          subject: true,
          priority: true
        }
      });
    } else {
      // Validate that conversationId is a valid UUID before querying
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(conversationId)) {
        return NextResponse.json(
          { error: 'Invalid conversation ID format' },
          { status: 400 }
        );
      }

      // Messages with other users
      messages = await prisma.message.findMany({
        where: {
          schoolId: user.schoolId,
          OR: [
            { fromUserId: user.id, toUserId: conversationId },
            { fromUserId: conversationId, toUserId: user.id }
          ]
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          fromUserId: true,
          toUserId: true,
          createdAt: true,
          isRead: true,
          subject: true,
          priority: true
        }
      });
    }

    // Mark messages as read
    if (conversationId === 'headadmin') {
      await prisma.message.updateMany({
        where: {
          schoolId: user.schoolId,
          toUserId: user.id,
          fromUserId: null,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } else {
      await prisma.message.updateMany({
        where: {
          schoolId: user.schoolId,
          fromUserId: conversationId,
          toUserId: user.id,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    // Add fromCurrentUser flag
    interface Message {
      id: string;
      content: string;
      fromUserId: string | null;
      toUserId: string | null;
      createdAt: Date;
      isRead: boolean;
      subject: string | null;
      priority: string | null;
    }

    interface ProcessedMessage extends Message {
      fromCurrentUser: boolean;
    }

    const processedMessages: ProcessedMessage[] = (messages as Message[]).map((msg: Message) => ({
      ...msg,
      fromCurrentUser: msg.fromUserId === user.id
    }));

    return NextResponse.json({ success: true, messages: processedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);

    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message;
      if (message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (message === 'Access denied') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}