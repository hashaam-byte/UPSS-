import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth( ['teacher']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: user.id,
        toUserId: conversationId,
        schoolId: user.schoolId,
        content: content.trim(),
        messageType: 'direct',
        priority: 'normal'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: {
        ...message,
        fromCurrentUser: true
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
