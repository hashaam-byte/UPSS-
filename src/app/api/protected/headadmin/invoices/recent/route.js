// /app/api/protected/headadmin/invoices/recent/route.js
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

    // Fetch recent payments with school information
    const payments = await prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: {
        status: { in: ['paid', 'pending'] }
      },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
        paidAt: true,
        school: {
          select: {
            name: true
          }
        }
      }
    });

    // Format the response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      schoolName: payment.school.name
    }));

    return NextResponse.json({
      payments: formattedPayments
    });

  } catch (error) {
    console.error('Failed to fetch recent payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}