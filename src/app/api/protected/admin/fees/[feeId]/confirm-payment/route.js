// /api/protected/admin/fees/[feeId]/confirm-payment
// Records a manual bank-transfer payment against a fee and recalculates
// its status (pending/partial/paid). This is the entire "payment gateway"
// for now — an admin manually confirms a transfer landed, no live API.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const user = await requireAuth(['ADMIN']);
    const feeId = params.feeId;
    const body = await request.json();
    const { amount, reference, notes, paymentDate } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'A positive amount is required' }, { status: 400 });
    }

    const fee = await prisma.studentFee.findFirst({
      where: { id: feeId, schoolId: user.schoolId }
    });
    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.studentFeePayment.create({
        data: {
          studentFeeId: feeId,
          amount,
          reference: reference || null,
          notes: notes || null,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          confirmedBy: user.id,
        }
      });

      const newAmountPaid = Number(fee.amountPaid) + Number(amount);
      const newStatus = newAmountPaid >= Number(fee.amount) ? 'paid' : 'partial';

      const updatedFee = await tx.studentFee.update({
        where: { id: feeId },
        data: { amountPaid: newAmountPaid, status: newStatus }
      });

      return { payment, updatedFee };
    });

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed',
      data: result
    });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
