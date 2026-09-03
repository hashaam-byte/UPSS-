// /api/auth/parent/verify-otp
// Step 2: parent submits the code they received. On success we hand back a
// short-lived, single-use "verification ticket" (not a login session) that
// the set-password step must present — this stops someone from setting a
// password without ever having proven they received the SMS.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyOtp } from '@/lib/otp';

export async function POST(request) {
  try {
    const body = await request.json();
    const { phone, code, purpose } = body;

    if (!phone || !code || !purpose) {
      return NextResponse.json({ error: 'phone, code, and purpose are required' }, { status: 400 });
    }

    if (!['IDENTITY_VERIFICATION', 'PASSWORD_RESET', 'CHILD_PASSWORD_RESET'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 });
    }

    const otp = await verifyOtp({ phone, purpose, code });

    // Short-lived ticket (5 minutes), scoped only to completing this specific flow
    const ticket = jwt.sign(
      {
        phone,
        purpose,
        schoolId: otp.schoolId,
        studentId: otp.studentId,
        type: 'otp_ticket'
      },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    return NextResponse.json({
      success: true,
      message: 'Code verified.',
      ticket
    });

  } catch (error) {
    const statusByCode = {
      NOT_FOUND: 404,
      EXPIRED: 410,
      LOCKED: 429,
      INVALID: 400
    };
    if (error.code && statusByCode[error.code]) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: statusByCode[error.code] });
    }
    console.error('Parent verify-otp error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
