// pages/api/protected/headadmin/messages/conversations.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../lib/authHelpers';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyHeadAdminAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
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
                { fromUserId: authResult.user.id, toUserId: adminUser.id },
                { fromUserId: adminUser.id, toUserId: authResult.user.id }
              ]
            },
            orderBy: { createdAt: 'desc' }
          });

          // Count unread messages from this user to head admin
          const unreadCount = await prisma.message.count({
            where: {
              fromUserId: adminUser.id,
              toUserId: authResult.user.id,
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

    return res.status(200).json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error('Failed to fetch conversations:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
