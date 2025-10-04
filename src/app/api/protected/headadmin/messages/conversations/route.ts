// app/api/protected/headadmin/messages/conversations/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Verify authentication and role
    const user = await requireAuth(['headadmin']);
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all schools with their admins
    const schools = await prisma.school.findMany({
      where: {
        isActive: true
      },
      include: {
        users: {
          where: {
            role: 'admin',
            isActive: true
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          },
          take: 1
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            fromUserId: true,
            isRead: true
          }
        }
      },
      orderBy: {
        messages: {
          _count: 'desc'
        }
      }
    });

    // Get unread counts for each school
    const unreadCounts = await prisma.message.groupBy({
      by: ['schoolId'],
      where: {
        fromUserId: { not: null },
        isRead: false
      },
      _count: {
        id: true
      }
    });

    const unreadMap = new Map(
      unreadCounts.map(item => [item.schoolId, item._count.id])
    );

    // Format conversations
    const formattedConversations = schools
      .filter(school => school.messages.length > 0 || school.users.length > 0)
      .map(school => ({
        id: `conv-${school.id}`,
        schoolId: school.id,
        userId: school.users[0]?.id || null,
        school: {
          id: school.id,
          name: school.name
        },
        user: school.users[0] || null,
        lastMessage: school.messages[0] || null,
        unreadCount: unreadMap.get(school.id) || 0
      }));

    return NextResponse.json({
      conversations: formattedConversations,
      total: formattedConversations.length
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}