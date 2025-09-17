// pages/api/protected/headadmin/messages/conversations.js
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get all schools with their admin users and last message
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
            email: true
          },
          take: 1
        }
      }
    });

    // Get conversations with last messages and unread counts
    const conversations = await Promise.all(
      schools
        .filter(school => school.users.length > 0)
        .map(async (school) => {
          const adminUser = school.users[0];
          
          // Get last message in conversation
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { fromUserId: user.id, toUserId: adminUser.id },
                { fromUserId: adminUser.id, toUserId: user.id }
              ]
            },
            orderBy: { createdAt: 'desc' }
          });

          // Count unread messages from this user to head admin
          const unreadCount = await prisma.message.count({
            where: {
              fromUserId: adminUser.id,
              toUserId: user.id,
              isRead: false
            }
          });

          return {
            id: `${school.id}-${adminUser.id}`,
            schoolId: school.id,
            userId: adminUser.id,
            school: {
              id: school.id,
              name: school.name,
              email: school.email
            },
            user: adminUser,
            lastMessage,
            unreadCount
          };
        })
    );

    // Sort by last message date
    conversations.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
 