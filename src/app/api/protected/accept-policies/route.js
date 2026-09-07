// /api/protected/accept-policies
// Records that the current user has accepted the Privacy Policy, Terms of
// Service, and Refund Policy. Currently only enforced for ADMIN accounts
// on first login (see the admin layout), but any authenticated role can
// call this — the requireAuth([]) below accepts any logged-in user.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth([]);
    return NextResponse.json({
      success: true,
      accepted: !!user.policyAcceptedAt,
      acceptedAt: user.policyAcceptedAt || null,
    });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth([]);
    const body = await request.json().catch(() => ({}));

    if (!body.agreed) {
      return NextResponse.json({ error: 'You must confirm you agree to continue' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { policyAcceptedAt: new Date() },
      select: { policyAcceptedAt: true },
    });

    return NextResponse.json({ success: true, acceptedAt: updated.policyAcceptedAt });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('Accept policies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
