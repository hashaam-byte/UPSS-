// pages/api/protected/headadmin/invoices/[id]/mark-paid.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Find invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        school: { select: { name: true } }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 });
    }

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
        verifiedBy: user.id,
        verifiedAt: new Date()
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
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

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice
    });

  } catch (error) {
    console.error('Failed to mark invoice as paid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}