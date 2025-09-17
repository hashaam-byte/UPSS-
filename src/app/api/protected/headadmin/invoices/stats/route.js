// pages/api/protected/headadmin/invoices/stats.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
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

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Failed to fetch invoice stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
