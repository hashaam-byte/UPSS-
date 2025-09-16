
// pages/api/protected/headadmin/invoices/stats.js
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

    // Get invoice statistics
    const [totalRevenue, pendingAmount, paidCount, overdueCount] = await Promise.all([
      // Total revenue from paid invoices
      prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true }
      }),
      
      // Pending amount
      prisma.invoice.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true }
      }),
      
      // Count of paid invoices
      prisma.invoice.count({
        where: { status: 'paid' }
      }),
      
      // Count of overdue invoices
      prisma.invoice.count({
        where: { 
          status: 'pending',
          dueDate: { lt: new Date() }
        }
      })
    ]);

    const stats = {
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingAmount: pendingAmount._sum.amount || 0,
      paidInvoices: paidCount,
      overdueInvoices: overdueCount
    };

    return res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Failed to fetch invoice stats:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
