
// pages/api/protected/headadmin/messages/send.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../lib/authHelpers';

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

    const { toUserId, schoolId, content, messageType = 'direct' } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (!toUserId) {
      return res.status(400).json({ error: 'Recipient is required' });
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: toUserId }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        fromUserId: authResult.user.id,
        toUserId,
        schoolId,
        content: content.trim(),
        messageType,
        priority: 'normal'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Failed to send message:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
