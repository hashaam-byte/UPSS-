// app/api/protected/headadmin/invoices/[id]/payments/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = params;

    // First check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Fetch payment history - this could come from multiple sources
    const payments = await prisma.payment.findMany({
      where: { invoiceId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        transactionId: true,
        gatewayResponse: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // If no payments table exists, we can create mock data or return empty
    // For now, let's return a structured response based on invoice status
    let paymentHistory = [];

    if (payments.length === 0) {
      // Check if invoice is paid and create a default payment record
      const invoiceDetails = await prisma.invoice.findUnique({
        where: { id },
        select: {
          status: true,
          amount: true,
          paidAt: true,
          verifiedBy: true,
          verifiedAt: true
        }
      });

      if (invoiceDetails.status === 'paid' && invoiceDetails.paidAt) {
        paymentHistory = [{
          id: `payment_${id}`,
          amount: invoiceDetails.amount,
          method: 'Manual Verification',
          status: 'completed',
          transactionId: null,
          createdAt: invoiceDetails.paidAt || invoiceDetails.verifiedAt,
          gatewayResponse: {
            verifiedBy: invoiceDetails.verifiedBy,
            verificationDate: invoiceDetails.verifiedAt
          }
        }];
      }
    } else {
      paymentHistory = payments;
    }

    return NextResponse.json({
      success: true,
      payments: paymentHistory
    });

  } catch (error) {
    console.error('Failed to fetch payment history:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}