
// pages/api/protected/headadmin/messages/conversations/[id].js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../../lib/authHelpers';

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

    const { id } = req.query;
    const [schoolId, userId] = id.split('-');

    // Get messages between head admin and school admin
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: authResult.user.id, toUserId: userId },
          { fromUserId: userId, toUserId: authResult.user.id }
        ]
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.status(200).json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
