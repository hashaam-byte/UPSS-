// /app/api/protected/admin/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await prisma.userSession.findFirst({
      where: {
        tokenHash,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { schoolId: true }
    });

    if (!user?.schoolId) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Get all messages involving this admin
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: decoded.userId },
          { toUserId: decoded.userId }
        ],
        messageType: { in: ['direct', 'system', 'broadcast'] }
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

    messages.forEach(message => {
      let otherUser;
      let conversationId;

      if (message.fromUserId === decoded.userId) {
        otherUser = message.toUser;
        conversationId = message.toUserId;
      } else if (message.toUserId === decoded.userId) {
        // Message from head admin (fromUserId is null) or another user
        if (message.fromUserId === null) {
          conversationId = 'headadmin';
          otherUser = {
            id: 'headadmin',
            firstName: 'Head',
            lastName: 'Administrator',
            email: 'admin@system.com',
            role: 'headadmin'
          };
        } else {
          otherUser = message.fromUser;
          conversationId = message.fromUserId;
        }
      }

      if (!otherUser) return;

      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          participant: otherUser,
          lastMessage: message,
          unreadCount: 0
        });
      }

      // Count unread messages
      if (message.toUserId === decoded.userId && !message.isRead) {
        const conv = conversationMap.get(conversationId);
        conv.unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
    );

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}