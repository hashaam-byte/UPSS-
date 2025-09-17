// app/api/protected/headadmin/invoices/[id]/cancel/route.js
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
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

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

    if (invoice.status === 'cancelled') {
      return NextResponse.json({ error: 'Invoice is already cancelled' }, { status: 400 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Cannot cancel a paid invoice' }, { status: 400 });
    }

    // Update invoice status
    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: user.id,
        cancellationReason: reason || 'Cancelled by admin'
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'invoice_cancelled',
        resource: 'invoice',
        resourceId: invoice.id,
        description: `Cancelled invoice ${invoice.invoiceNumber} for ${invoice.school.name}`,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          schoolName: invoice.school.name,
          amount: invoice.amount,
          reason: reason || 'No reason provided'
        }
      }
    });

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
      message: 'Invoice cancelled successfully'
    });

  } catch (error) {
    console.error('Failed to cancel invoice:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}