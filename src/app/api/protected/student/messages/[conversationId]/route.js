
// /app/api/protected/students/messages/[conversationId]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await requireAuth(token);
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const conversationId = params.conversationId;

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let otherUserId = conversationId === 'system' ? null : conversationId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId }
        ],
        schoolId: userInfo.schoolId
      },
      orderBy: { createdAt: 'asc' },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        fromUserId: otherUserId,
        toUserId: userId,
        isRead: false,
        schoolId: userInfo.schoolId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Add fromCurrentUser flag
    const processedMessages = messages.map(message => ({
      ...message,
      fromCurrentUser: message.fromUserId === userId
    }));

    return NextResponse.json({ messages: processedMessages });
  } catch (error) {
    console.error('Error fetching student conversation messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// /app/api/protected/students/messages/send/route.js
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { conversationId, content, messageType = 'direct' } = await request.json();
    const userId = decoded.userId;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let toUserId = conversationId === 'system' ? null : conversationId;

    // Verify the target user exists and is in the same school (if not system)
    if (toUserId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: toUserId },
        select: { schoolId: true, role: true }
      });

      if (!targetUser || targetUser.schoolId !== userInfo.schoolId) {
        return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
      }

      // Students can only message teachers, admins, and other students in their school
      const allowedRoles = ['admin', 'teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher', 'student'];
      if (!allowedRoles.includes(targetUser.role)) {
        return NextResponse.json({ error: 'Cannot message this user' }, { status: 403 });
      }
    }

    const message = await prisma.message.create({
      data: {
        fromUserId: userId,
        toUserId,
        schoolId: userInfo.schoolId,
        content: content.trim(),
        messageType,
        priority: 'normal'
      },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error sending student message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}