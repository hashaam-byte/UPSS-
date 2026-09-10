// /api/protected/parent/fees/[feeId]/pay
// Starts an online payment for one of the parent's linked children's fees,
// using the SCHOOL's own connected Paystack account — the money settles
// directly with the school, U-Plus never touches it.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { decryptSecret } from '@/lib/payment-crypto';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const user = await requireAuth(['PARENT']);
    const feeId = params.feeId;

    // Even though this is already behind auth, rate-limit payment attempts
    // specifically — this is the endpoint that actually talks to Paystack
    // and creates real transaction attempts, so it deserves its own limit
    // separate from general API usage.
    const ip = getClientIp(request);
    const ipLimit = await checkRateLimit(`payment-init:ip:${ip}`, 10, 10 * 60);
    const userLimit = await checkRateLimit(`payment-init:user:${user.id}`, 10, 10 * 60);
    if (!ipLimit.allowed || !userLimit.allowed) {
      return NextResponse.json({ error: 'Too many payment attempts. Please wait a few minutes and try again.' }, { status: 429 });
    }

    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: user.id } });
    if (!parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const fee = await prisma.studentFee.findUnique({
      where: { id: feeId },
      include: { student: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 });
    }

    // Confirm this fee actually belongs to one of THIS parent's linked children
    const link = await prisma.parentStudentLink.findUnique({
      where: { parentId_studentId: { parentId: parentProfile.id, studentId: fee.studentId } },
    });
    if (!link) {
      return NextResponse.json({ error: 'This fee does not belong to your account' }, { status: 403 });
    }

    if (fee.status === 'paid') {
      return NextResponse.json({ error: 'This fee is already fully paid' }, { status: 400 });
    }

    const config = await prisma.schoolPaymentConfig.findUnique({ where: { schoolId: fee.schoolId } });
    if (!config || !config.isActive) {
      return NextResponse.json({
        error: 'This school has not set up online payments yet. Please pay by bank transfer instead.',
      }, { status: 400 });
    }

    const balance = Number(fee.amount) - Number(fee.amountPaid);
    const body = await request.json().catch(() => ({}));
    // Allow partial payment, but never more than the outstanding balance
    const amount = body.amount ? Math.min(Number(body.amount), balance) : balance;

    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
    }

    const secretKey = decryptSecret(config.secretKeyEncrypted);
    const reference = `upfee_${feeId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email || `${user.id}@parent.uplus.internal`, // Paystack requires an email; parents are phone-first
        amount: Math.round(amount * 100), // Paystack expects kobo
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/protected/parent/fees?payment=complete`,
        metadata: {
          feeId,
          studentName: `${fee.student.firstName} ${fee.student.lastName}`,
          feeTitle: fee.title,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      console.error('Paystack initialize failed:', paystackData);
      return NextResponse.json({ error: 'Failed to start payment. Please try again or use bank transfer.' }, { status: 502 });
    }

    await prisma.studentFeeOnlinePayment.create({
      data: {
        studentFeeId: feeId,
        reference,
        amount,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: paystackData.data.authorization_url,
      reference,
    });

  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
