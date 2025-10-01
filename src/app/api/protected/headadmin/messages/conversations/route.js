// /app/api/protected/headadmin/messages/conversations/route.js
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

    if (!session || decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all unique conversations with school admins
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: decoded.userId },
          { toUserId: decoded.userId }
        ],
        messageType: { in: ['direct', 'system'] }
      },
      include: {
        fromUser: {
          include: {
            school: true
          }
        },
        toUser: {
          include: {
            school: true
          }
        },
        school: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group messages by conversation
    const conversationMap = new Map();

    messages.forEach(message => {
      const otherUser = message.fromUserId === decoded.userId 
        ? message.toUser 
        : message.fromUser;
      
      if (!otherUser || otherUser.role !== 'admin') return;

      const conversationId = otherUser.id;

      if (!conversationMap.has(conversationId)) {
        conversationMap.set(conversationId, {
          id: conversationId,
          userId: otherUser.id,
          schoolId: otherUser.schoolId,
          user: {
            id: otherUser.id,
            firstName: otherUser.firstName,
            lastName: otherUser.lastName,
            email: otherUser.email,
            avatar: otherUser.avatar,
            role: otherUser.role
          },
          school: otherUser.school,
          lastMessage: message,
          unreadCount: 0
        });
      }

      // Count unread messages from this user
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