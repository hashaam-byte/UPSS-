// src/app/api/auth/forgot/route.ts
import { NextResponse } from 'next/server';
import { prisma, withTenant } from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, schoolSlug, userType } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    if (userType === 'head') {
      const admin = await prisma.headAdmin.findUnique({ where: { email } });
      console.log('Head admin reset token:', resetToken);
    } else if (schoolSlug) {
      const school = await prisma.school.findUnique({ where: { slug: schoolSlug } });
      if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 });

      await withTenant(school.db_schema, async (client) => {
        const user = await client.$queryRaw<Array<{id: string}>>`
          SELECT id FROM users WHERE email = ${email} AND status = 'ACTIVE' LIMIT 1
        `;
        if (user.length) console.log('School user reset token:', resetToken);
      });
    }

    return NextResponse.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
