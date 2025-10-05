// /app/api/protected/students/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth(['student']);

    // Get all conversations (messages where student is recipient or sender)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { toUserId: user.id },
          { fromUserId: user.id }
        ],
        schoolId: user.schoolId
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            teacherProfile: {
              include: {
                teacherSubjects: {
                  include: {
                    subject: true
                  }
                }
              }
            }
          }
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group messages into conversations
    const conversationsMap = new Map();

    messages.forEach(message => {
      const otherUserId = message.fromUserId === user.id 
        ? message.toUserId 
        : message.fromUserId;
      
      const otherUser = message.fromUserId === user.id 
        ? message.toUser 
        : message.fromUser;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          id: otherUserId,
          participant: otherUser,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        });
      }

      const conversation = conversationsMap.get(otherUserId);
      conversation.messages.push(message);

      // Update last message
      if (!conversation.lastMessage || new Date(message.createdAt) > new Date(conversation.lastMessage.createdAt)) {
        conversation.lastMessage = message;
      }

      // Count unread
      if (message.toUserId === user.id && !message.isRead) {
        conversation.unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    // Get all teachers in the school for new conversations
    const allTeachers = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'teacher',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherProfile: {
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      conversations,
      allTeachers
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
