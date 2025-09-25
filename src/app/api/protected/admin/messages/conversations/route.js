// /app/api/protected/admin/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    // Get all potential conversation participants in the same school
    const potentialContacts = await prisma.user.findMany({
      where: {
        schoolId: userInfo.schoolId,
        isActive: true,
        id: { not: userId }, // Exclude self
        OR: [
          { role: 'teacher' },
          { role: 'director' }, 
          { role: 'coordinator' },
          { role: 'class_teacher' },
          { role: 'subject_teacher' },
          { role: 'student' }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
      }
    });

    // Check for messages with each contact and head admin
    const conversations = [];

    // Add head admin conversation
    const headAdminMessages = await prisma.message.findFirst({
      where: {
        schoolId: userInfo.schoolId,
        OR: [
          { fromUserId: null, toUserId: userId },
          { fromUserId: userId, toUserId: null }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (headAdminMessages) {
      const unreadCount = await prisma.message.count({
        where: {
          schoolId: userInfo.schoolId,
          fromUserId: null,
          toUserId: userId,
          isRead: false
        }
      });

      conversations.push({
        id: 'headadmin',
        participant: {
          id: 'headadmin',
          firstName: 'Head',
          lastName: 'Administrator',
          role: 'headadmin'
        },
        lastMessage: headAdminMessages,
        unreadCount
      });
    }

    // Add other user conversations
    for (const contact of potentialContacts) {
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { fromUserId: userId, toUserId: contact.id },
            { fromUserId: contact.id, toUserId: userId }
          ],
          schoolId: userInfo.schoolId
        },
        orderBy: { createdAt: 'desc' }
      });

      if (lastMessage) {
        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: contact.id,
            toUserId: userId,
            isRead: false,
            schoolId: userInfo.schoolId
          }
        });

        conversations.push({
          id: contact.id,
          participant: contact,
          lastMessage,
          unreadCount
        });
      }
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
