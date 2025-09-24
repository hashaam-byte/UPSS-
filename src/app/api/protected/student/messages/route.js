// /app/api/protected/students/messages/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
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
