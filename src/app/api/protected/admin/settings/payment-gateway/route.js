// /api/protected/admin/settings/payment-gateway
// Lets a school admin connect their OWN payment gateway (currently
// Paystack) so parent fee payments settle directly into the school's own
// account — U-Plus never touches or holds the money. The secret key is
// encrypted at rest (see /lib/payment-crypto.js) and NEVER sent back to
// the browser, not even to the admin who originally set it — only a
// masked preview and whether one is configured at all.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { encryptSecret } from '@/lib/payment-crypto';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const user = await requireAuth(['ADMIN']);

    const config = await prisma.schoolPaymentConfig.findUnique({
      where: { schoolId: user.schoolId },
    });

    if (!config) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        provider: config.provider,
        publicKey: config.publicKey,
        hasSecretKey: !!config.secretKeyEncrypted,
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      },
    });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Payment gateway settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['ADMIN']);
    const body = await request.json();
    const { provider = 'paystack', publicKey, secretKey } = body;

    if (provider !== 'paystack') {
      return NextResponse.json({ error: 'Only Paystack is supported right now' }, { status: 400 });
    }
    if (!publicKey || !publicKey.startsWith('pk_')) {
      return NextResponse.json({ error: 'That doesn\'t look like a valid Paystack public key (should start with pk_)' }, { status: 400 });
    }

    const existing = await prisma.schoolPaymentConfig.findUnique({ where: { schoolId: user.schoolId } });

    // secretKey is optional on update — omit it to change only the public key
    // without having to re-paste the secret every time.
    if (!secretKey && !existing) {
      return NextResponse.json({ error: 'A secret key is required the first time you connect a gateway' }, { status: 400 });
    }
    if (secretKey && !secretKey.startsWith('sk_')) {
      return NextResponse.json({ error: 'That doesn\'t look like a valid Paystack secret key (should start with sk_)' }, { status: 400 });
    }

    const data = {
      provider,
      publicKey,
      isActive: true,
      ...(secretKey && { secretKeyEncrypted: encryptSecret(secretKey) }),
    };

    const config = await prisma.schoolPaymentConfig.upsert({
      where: { schoolId: user.schoolId },
      update: data,
      create: { schoolId: user.schoolId, ...data },
    });

    await logAudit({
      userId: user.id,
      action: existing ? 'payment_gateway.update' : 'payment_gateway.connect',
      resource: 'SchoolPaymentConfig',
      resourceId: config.id,
      description: `${existing ? 'Updated' : 'Connected'} Paystack payment gateway for school`,
      metadata: { provider, secretKeyChanged: !!secretKey },
      request,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment gateway connected. Parents can now pay online.',
      data: {
        provider: config.provider,
        publicKey: config.publicKey,
        hasSecretKey: true,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Payment gateway settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await requireAuth(['ADMIN']);
    await prisma.schoolPaymentConfig.deleteMany({ where: { schoolId: user.schoolId } });
    await logAudit({
      userId: user.id,
      action: 'payment_gateway.disconnect',
      resource: 'SchoolPaymentConfig',
      description: 'Disconnected payment gateway for school',
      request,
    });
    return NextResponse.json({ success: true, message: 'Payment gateway disconnected. Parents will go back to bank-transfer payments.' });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Payment gateway disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
