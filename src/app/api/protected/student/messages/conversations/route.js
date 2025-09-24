// /app/api/protected/students/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await requireAuth(token);
    
    if (decoded.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Extract user ID from decoded token
    const userId = decoded.id; // Based on your token structure
    
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token: missing user ID' }, { status: 401 });
    }

    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, role: true, firstName: true, lastName: true }
    });

    if (!userInfo) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
        createdAt: true
        // Removed id from _max since PostgreSQL can't use MAX() on UUID fields
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
    
    // More detailed error logging
    if (error.name === 'PrismaClientKnownRequestError') {
      console.error('Prisma error code:', error.code);
      console.error('Prisma error meta:', error.meta);
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message // Remove this in production
    }, { status: 500 });
  }
}