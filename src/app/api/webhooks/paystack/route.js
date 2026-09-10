// /api/webhooks/paystack
// Receives payment confirmation from Paystack. Security model, since each
// school has its OWN secret key (not one shared platform key):
//   1. Extract the feeId from the transaction reference (format:
//      upfee_{feeId}_{timestamp}_{random}) — untrusted at this point.
//   2. Look up that fee -> its school -> that school's own secret key.
//   3. Verify the x-paystack-signature header (HMAC-SHA512 of the raw
//      body) using THAT school's secret key. Reject if it doesn't match
//      — this is what actually proves the request came from Paystack for
//      this specific school's account, not just any caller who guessed a
//      fee ID.
//   4. As defense-in-depth, re-verify the transaction server-to-server
//      via Paystack's /transaction/verify endpoint before trusting the
//      amount — never trust a webhook payload's amount field alone.
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { decryptSecret } from '@/lib/payment-crypto';
import { getClientIp } from '@/lib/rate-limit';

// Optional extra layer alongside signature verification (the essential
// check, done below). Paystack publishes the source IPs their webhooks
// come from, but these can change over time — rather than hardcode a
// list that could go stale and start rejecting real payments, this reads
// from an env var so it can be updated without a code deploy. If unset,
// this layer is simply skipped — signature verification alone is still
// considered sufficient per Paystack's own guidance.
function isFromAllowedIp(request) {
  const allowlist = process.env.PAYSTACK_WEBHOOK_IPS;
  if (!allowlist) return true; // not configured — skip this layer, don't fail closed
  const allowed = allowlist.split(',').map(ip => ip.trim());
  const requestIp = getClientIp(request);
  return allowed.includes(requestIp);
}

export async function POST(request) {
  try {
    if (!isFromAllowedIp(request)) {
      console.error('Paystack webhook rejected: source IP not in PAYSTACK_WEBHOOK_IPS allowlist');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const reference = payload?.data?.reference;
    const feeIdMatch = /^upfee_([a-f0-9-]+)_/.exec(reference || '');
    if (!feeIdMatch) {
      // Not one of our references — ignore quietly rather than erroring,
      // in case this endpoint is ever shared across other uses later.
      return NextResponse.json({ received: true });
    }
    const feeId = feeIdMatch[1];

    const fee = await prisma.studentFee.findUnique({ where: { id: feeId } });
    if (!fee) {
      return NextResponse.json({ received: true }); // unknown fee — nothing to do
    }

    const config = await prisma.schoolPaymentConfig.findUnique({ where: { schoolId: fee.schoolId } });
    if (!config) {
      return NextResponse.json({ received: true });
    }

    const secretKey = decryptSecret(config.secretKeyEncrypted);
    const expectedSignature = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');

    if (expectedSignature !== signature) {
      console.error('Paystack webhook signature mismatch for fee', feeId);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (payload.event !== 'charge.success') {
      return NextResponse.json({ received: true });
    }

    const onlinePayment = await prisma.studentFeeOnlinePayment.findUnique({ where: { reference } });
    if (!onlinePayment || onlinePayment.status === 'success') {
      // Already processed (webhook retries are normal) or not one we created
      return NextResponse.json({ received: true });
    }

    // Defense-in-depth: re-verify server-to-server rather than trusting the
    // webhook payload's amount directly.
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData?.data?.status !== 'success') {
      console.error('Paystack verify call did not confirm success for', reference);
      return NextResponse.json({ received: true });
    }

    const confirmedAmount = verifyData.data.amount / 100; // kobo -> naira

    await prisma.$transaction(async (tx) => {
      await tx.studentFeeOnlinePayment.update({
        where: { reference },
        data: { status: 'success', paidAt: new Date() },
      });

      const currentFee = await tx.studentFee.findUnique({ where: { id: feeId } });
      const newAmountPaid = Number(currentFee.amountPaid) + confirmedAmount;
      const newStatus = newAmountPaid >= Number(currentFee.amount) ? 'paid' : 'partial';

      await tx.studentFee.update({
        where: { id: feeId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      });

      // Also record it in the same table the manual-confirm flow uses, so
      // parents/admins see one consistent payment history either way.
      await tx.studentFeePayment.create({
        data: {
          studentFeeId: feeId,
          amount: confirmedAmount,
          method: 'paystack',
          reference,
          confirmedBy: fee.createdBy, // system-confirmed; attributed to whoever created the fee for audit purposes
        },
      });
    });

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    // Still return 200-ish shape Paystack expects, so it doesn't endlessly retry
    // a request that failed for a reason unrelated to the payment itself.
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
