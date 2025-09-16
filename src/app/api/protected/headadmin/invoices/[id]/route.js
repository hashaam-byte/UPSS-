
// pages/api/protected/headadmin/invoices/[id]/index.js
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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            email: true,
            slug: true,
            address: true,
            phone: true
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.status(200).json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
