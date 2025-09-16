
// pages/api/protected/headadmin/messages/broadcast.js
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

    const { subject, content, priority = 'normal' } = req.body;

    if (!subject || !subject.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    // Get all active school admins
    const schoolAdmins = await prisma.user.findMany({
      where: {
        role: 'admin',
        isActive: true,
        schoolId: { not: null }
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    const activeAdmins = schoolAdmins.filter(admin => admin.school?.isActive);

    if (activeAdmins.length === 0) {
      return res.status(400).json({ error: 'No active school administrators found' });
    }

    // Create broadcast messages
    const messages = await prisma.message.createMany({
      data: activeAdmins.map(admin => ({
        fromUserId: authResult.user.id,
        toUserId: admin.id,
        schoolId: admin.schoolId,
        subject: subject.trim(),
        content: content.trim(),
        messageType: 'broadcast',
        priority,
        isBroadcast: true
      }))
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.id,
        action: 'broadcast_sent',
        resource: 'message',
        description: `Sent broadcast message to ${activeAdmins.length} school administrators`,
        metadata: {
          subject: subject.trim(),
          recipientCount: activeAdmins.length,
          priority
        }
      }
    });

    return res.status(201).json({
      success: true,
      messagesSent: activeAdmins.length
    });

  } catch (error) {
    console.error('Failed to send broadcast:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}