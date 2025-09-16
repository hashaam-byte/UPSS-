
// pages/api/protected/headadmin/invoices/[id]/mark-paid.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../../lib/authHelpers';

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

    // Find invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        school: { select: { name: true } }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ error: 'Invoice is already paid' });
    }

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        verifiedBy: authResult.user.id,
        verifiedAt: new Date()
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: authResult.user.id,
        action: 'invoice_paid',
        resource: 'invoice',
        resourceId: invoice.id,
        description: `Marked invoice ${invoice.invoiceNumber} as paid for ${invoice.school.name}`,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          schoolName: invoice.school.name,
          amount: invoice.amount
        }
      }
    });

    return res.status(200).json({
      success: true,
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Failed to mark invoice as paid:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}