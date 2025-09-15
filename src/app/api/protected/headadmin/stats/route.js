// /app/api/protected/headadmin/stats/route.js
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

    // Get basic statistics
    const [
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      monthlyInvoices
    ] = await Promise.all([
      // Total schools
      prisma.school.count(),
      
      // Active schools
      prisma.school.count({
        where: { isActive: true }
      }),
      
      // Suspended schools
      prisma.school.count({
        where: { isActive: false }
      }),
      
      // Total users across all schools
      prisma.user.count({
        where: {
          role: { in: ['admin', 'teacher', 'student'] }
        }
      }),
      
      // Monthly invoices (current month)
      prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
          }
        },
        select: {
          amount: true,
          status: true
        }
      })
    ]);

    // Calculate monthly revenue
    const monthlyRevenue = monthlyInvoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);

    // Count pending payments
    const pendingPayments = monthlyInvoices
      .filter(invoice => invoice.status === 'pending').length;

    return NextResponse.json({
      totalSchools,
      activeSchools,
      suspendedSchools,
      totalUsers,
      monthlyRevenue,
      pendingPayments
    });

  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}