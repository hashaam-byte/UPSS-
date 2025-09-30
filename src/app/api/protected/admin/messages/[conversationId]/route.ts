import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const user = await requireAuth(request, ['admin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await context.params;

    const messages = await prisma.message.findMany({
      where: {
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
        isRead: true
      }
    });

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

    const messagesWithFlag = messages.map(msg => ({
      ...msg,
      fromCurrentUser: msg.fromUserId === user.id
    }));

    return NextResponse.json({ success: true, messages: messagesWithFlag });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
