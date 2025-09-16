
// pages/api/protected/headadmin/messages/conversations/[id]/read.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../../../lib/authHelpers';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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

    // Mark all messages from this user as read
    await prisma.message.updateMany({
      where: {
        fromUserId: userId,
        toUserId: authResult.user.id,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error('Failed to mark messages as read:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
