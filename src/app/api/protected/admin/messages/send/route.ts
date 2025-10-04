// app/api/protected/admin/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['admin']);
    const { conversationId, content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }

    // Determine toUserId based on conversationId
    let toUserId: string | null;
    
    if (conversationId === 'headadmin') {
      // Message to head admin (toUserId is null)
      toUserId = null;
    } else {
      // Validate UUID format for regular users
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(conversationId)) {
        return NextResponse.json(
          { error: 'Invalid recipient ID format' },
          { status: 400 }
        );
      }
      
      toUserId = conversationId;
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: user.id,
        toUserId: toUserId,
        schoolId: user.schoolId,
        content: content.trim(),
        messageType: 'direct',
        priority: 'normal'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        toUser: toUserId ? {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        } : undefined
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
    
    if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: string }).message === 'string') {
      if ((error as { message: string }).message === 'Authentication required') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if ((error as { message: string }).message === 'Access denied') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}