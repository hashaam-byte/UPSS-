// /app/api/protected/headadmin/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all conversations with school admins
    const conversations = await prisma.message.groupBy({
      by: ['schoolId', 'toUserId'],
      where: {
        OR: [
          { fromUserId: null }, // Messages from head admin
          { toUserId: null }     // Messages to head admin
        ]
      },
      _max: {
        createdAt: true,
        id: true
      }
    });

    // Enrich with school and user data
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const [school, user, lastMessage, unreadCount] = await Promise.all([
          prisma.school.findUnique({
            where: { id: conv.schoolId },
            select: { id: true, name: true }
          }),
          prisma.user.findUnique({
            where: { id: conv.toUserId },
            select: { id: true, firstName: true, lastName: true, email: true }
          }),
          prisma.message.findFirst({
            where: {
              schoolId: conv.schoolId,
              OR: [
                { fromUserId: null, toUserId: conv.toUserId },
                { fromUserId: conv.toUserId, toUserId: null }
              ]
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, content: true, createdAt: true, fromUserId: true }
          }),
          prisma.message.count({
            where: {
              schoolId: conv.schoolId,
              fromUserId: conv.toUserId,
              toUserId: null,
              isRead: false
            }
          })
        ]);

        return {
          id: `${conv.schoolId}-${conv.toUserId}`,
          schoolId: conv.schoolId,
          userId: conv.toUserId,
          school,
          user,
          lastMessage,
          unreadCount
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
