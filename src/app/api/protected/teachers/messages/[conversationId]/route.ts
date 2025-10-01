import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth(['teacher']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params to get the conversationId
    const { conversationId } = await params;
    const participantId = conversationId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: user.id, toUserId: participantId },
          { fromUserId: participantId, toUserId: user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        fromUserId: true,
        toUserId: true,
        createdAt: true,
        isRead: true
      }
    });

    await prisma.message.updateMany({
      where: {
        fromUserId: participantId,
        toUserId: user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    interface Message {
      id: string;
      content: string;
      fromUserId: string;
      toUserId: string;
      createdAt: Date;
      isRead: boolean;
    }

    interface MessageWithFlag extends Message {
      fromCurrentUser: boolean;
    }

    const messagesWithFlag: MessageWithFlag[] = messages.map((msg: Message): MessageWithFlag => ({
      ...msg,
      fromCurrentUser: msg.fromUserId === user.id
    }));

    return NextResponse.json({ success: true, messages: messagesWithFlag });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}