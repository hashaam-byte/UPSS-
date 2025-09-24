// /app/api/protected/teachers/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    if (!user || user.role !== 'teacher') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = user.id;
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, role: true }
    });

    // Get all conversations this teacher is part of
    const conversations = await prisma.message.groupBy({
      by: ['fromUserId', 'toUserId'],
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ],
        schoolId: userSchool.schoolId
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
        // Head admin conversation
        participant = {
          id: 'headadmin',
          firstName: 'Head',
          lastName: 'Administrator',
          role: 'headadmin'
        };
      } else {
        participant = await prisma.user.findUnique({
          where: { id: participantId },
          select: { id: true, firstName: true, lastName: true, role: true, email: true }
        });
      }

      if (participant) {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { fromUserId: userId, toUserId: participantId },
              { fromUserId: participantId, toUserId: userId }
            ],
            schoolId: userSchool.schoolId
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: participantId,
            toUserId: userId,
            isRead: false,
            schoolId: userSchool.schoolId
          }
        });

        enrichedConversations.push({
          id: participantId || 'headadmin',
          participant,
          lastMessage,
          unreadCount
        });
      }
    }

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Error fetching teacher conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
