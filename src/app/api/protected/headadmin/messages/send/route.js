// /app/api/protected/headadmin/messages/send/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function POST(request) {
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

    const { toUserId, schoolId, content, messageType = 'direct' } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (!toUserId) {
      return NextResponse.json(
        { error: 'Recipient is required' },
        { status: 400 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        fromUserId: null, // null for head admin (system messages)
        toUserId,
        schoolId: schoolId || null,
        content: content.trim(),
        messageType,
        priority: 'normal',
        isRead: false
      }
    });

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}