// /app/api/protected/headadmin/messages/conversations/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function GET(request, { params }) {
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

    const { id } = params;
    const otherUserId = id.startsWith('admin-') ? id.substring(6) : id; // Extract UUID

    // Get all messages between head admin and this user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: decoded.userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: decoded.userId }
        ],
        messageType: { in: ['direct', 'system'] }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}