// /app/api/protected/students/messages/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        schoolId: true,
        studentProfile: {
          select: { className: true, section: true }
        }
      }
    });

    // Get all messages for this student
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ],
        schoolId: userInfo.schoolId
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true, role: true }
        },
        toUser: {
          select: { id: true, firstName: true, lastName: true, role: true }
        }
      }
    });

    // Get unique conversations (group by other participant)
    const conversationMap = new Map();
    
    messages.forEach(message => {
      const otherUserId = message.fromUserId === userId ? message.toUserId : message.fromUserId;
      const otherUser = message.fromUserId === userId ? message.toUser : message.fromUser;
      const key = otherUserId || 'system';
      
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          id: key,
          participant: otherUser || { firstName: 'System', lastName: 'Administrator', role: 'system' },
          messages: [],
          unreadCount: 0,
          lastMessage: null
        });
      }
      
      const conversation = conversationMap.get(key);
      conversation.messages.push({
        ...message,
        fromCurrentUser: message.fromUserId === userId
      });
      
      if (!conversation.lastMessage || new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
        conversation.lastMessage = message;
      }
      
      if (message.toUserId === userId && !message.isRead) {
        conversation.unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values()).map(conv => ({
      ...conv,
      messages: conv.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    }));

    return NextResponse.json({ 
      messages: Array.from(conversationMap.values()).flatMap(c => c.messages),
      conversations,
      studentInfo: userInfo.studentProfile
    });
  } catch (error) {
    console.error('Error fetching student messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// /app/api/protected/students/messages/conversations/route.js
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    // Get conversations - group messages by other participant
    const conversations = await prisma.message.groupBy({
      by: ['fromUserId', 'toUserId'],
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ],
        schoolId: userInfo.schoolId
      },
      _max: {
        createdAt: true,
        id: true
      }
    });

    // Get unique participant IDs
    const participantIds = new Set();
    conversations.forEach(conv => {
      if (conv.fromUserId && conv.fromUserId !== userId) participantIds.add(conv.fromUserId);
      if (conv.toUserId && conv.toUserId !== userId) participantIds.add(conv.toUserId);
    });

    const enrichedConversations = [];

    // Process each participant
    for (const participantId of participantIds) {
      let participant;
      
      if (participantId === null) {
        // System/admin message
        participant = {
          id: 'system',
          firstName: 'School',
          lastName: 'Administration',
          role: 'admin'
        };
      } else {
        participant = await prisma.user.findUnique({
          where: { id: participantId },
          select: { id: true, firstName: true, lastName: true, role: true }
        });
      }

      if (participant) {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { fromUserId: userId, toUserId: participantId },
              { fromUserId: participantId, toUserId: userId }
            ],
            schoolId: userInfo.schoolId
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: participantId,
            toUserId: userId,
            isRead: false,
            schoolId: userInfo.schoolId
          }
        });

        enrichedConversations.push({
          id: participantId || 'system',
          participant,
          lastMessage,
          unreadCount
        });
      }
    }

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Error fetching student conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// /app/api/protected/students/messages/[conversationId]/route.js
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
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