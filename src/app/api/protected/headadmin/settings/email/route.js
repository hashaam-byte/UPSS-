
// pages/api/protected/headadmin/settings/email.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../lib/authHelpers';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Verify authentication
    const authResult = await verifyHeadAdminAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    if (req.method === 'GET') {
      return res.status(200).json({
        success: true,
        settings: {
          smtpHost: '',
          smtpPort: 587,
          smtpUsername: '',
          smtpPassword: '',
          fromEmail: '',
          fromName: 'School Management System',
          enableSsl: true
        }
      });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Email settings error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}