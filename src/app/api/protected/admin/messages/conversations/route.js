// app/api/protected/admin/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await requireAuth(['admin']);

    // Get all messages involving this admin
    const messages = await prisma.message.findMany({
      where: {
        schoolId: user.schoolId,
        OR: [
          { fromUserId: user.id },
          { toUserId: user.id }
        ],
        messageType: { in: ['direct', 'system'] }
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group messages by conversation
    const conversationMap = new Map();

    messages.forEach((message) => {
      let otherUser;
      let conversationId;

      if (message.fromUserId === user.id) {
        // Message sent by admin
        otherUser = message.toUser;
        conversationId = message.toUserId ?? undefined;
      } else if (message.toUserId === user.id) {
        // Message received by admin
        if (message.fromUserId === null) {
          // Message from head admin (system)
          conversationId = 'headadmin';
          otherUser = {
            id: 'headadmin',
            firstName: 'Head',
            lastName: 'Administrator',
            email: 'system@admin.com',
            role: 'headadmin',
            avatar: null
          };
        } else {
          otherUser = message.fromUser;
          conversationId = message.fromUserId ?? undefined;
        }
      }

      if (!otherUser || !conversationId) return;

      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          participant: otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      }

      // Update to latest message if newer
      const existing = conversationMap.get(conversationId);
      if (new Date(message.createdAt) > new Date(existing.lastMessage.createdAt)) {
        existing.lastMessage = message;
      }

      // Count unread messages
      if (message.toUserId === user.id && !message.isRead) {
        existing.unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);

    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (error.message === 'Access denied') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}