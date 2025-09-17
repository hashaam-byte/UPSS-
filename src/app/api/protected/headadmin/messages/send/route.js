// pages/api/protected/headadmin/messages/send.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { toUserId, schoolId, content, messageType = 'direct' } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    if (!toUserId) {
      return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId }
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        fromUserId: user.id,
        toUserId,
        schoolId,
        content: content.trim(),
        messageType,
        priority: 'normal'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
   