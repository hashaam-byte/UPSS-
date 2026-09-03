// /api/protected/parent/child-password
// Lets a logged-in parent reset a linked child's password. Re-verifies the
// parent's own phone via a fresh OTP each time (not just their existing
// session) so a stolen session alone can't be used to take over a child's
// account.
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { requireAuth, validatePassword } from '@/lib/auth';
import { issueOtp, verifyOtp } from '@/lib/otp';

async function assertLinkedChild(parentUserId, studentId) {
  const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: parentUserId } });
  if (!parentProfile) throw Object.assign(new Error('Parent profile not found'), { status: 404 });

  const link = await prisma.parentStudentLink.findUnique({
    where: { parentId_studentId: { parentId: parentProfile.id, studentId } }
  });
  if (!link) throw Object.assign(new Error('This student is not linked to your account'), { status: 403 });

  return parentProfile;
}

// POST - request an OTP (sent to the PARENT's own phone) to authorize a child's password reset
export async function POST(request) {
  try {
    const user = await requireAuth(['PARENT']);
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const parentProfile = await assertLinkedChild(user.id, studentId);

    await issueOtp({
      phone: parentProfile.phone,
      purpose: 'CHILD_PASSWORD_RESET',
      schoolId: parentProfile.schoolId,
      studentId
    });

    return NextResponse.json({
      success: true,
      message: 'A verification code has been sent to your phone.'
    });

  } catch (error) {
    if (error.status) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error.code === 'RATE_LIMITED') return NextResponse.json({ error: error.message }, { status: 429 });
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Child password OTP request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - confirm the OTP and set the child's new password
export async function PUT(request) {
  try {
    const user = await requireAuth(['PARENT']);
    const body = await request.json();
    const { studentId, code, newPassword } = body;

    if (!studentId || !code || !newPassword) {
      return NextResponse.json({ error: 'studentId, code, and newPassword are required' }, { status: 400 });
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return NextResponse.json({ error: 'Weak password', details: passwordCheck.errors }, { status: 400 });
    }

    const parentProfile = await assertLinkedChild(user.id, studentId);

    const otp = await verifyOtp({ phone: parentProfile.phone, purpose: 'CHILD_PASSWORD_RESET', code });

    // Make sure the verified OTP was actually issued for THIS child, not a different one
    if (otp.studentId !== studentId) {
      return NextResponse.json({ error: 'This code was not issued for this student' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: studentId },
      data: { passwordHash }
    });

    // Invalidate the student's existing sessions
    await prisma.userSession.deleteMany({ where: { userId: studentId } });

    return NextResponse.json({
      success: true,
      message: "Your child's password has been updated successfully."
    });

  } catch (error) {
    if (error.status) return NextResponse.json({ error: error.message }, { status: error.status });
    const statusByCode = { NOT_FOUND: 404, EXPIRED: 410, LOCKED: 429, INVALID: 400 };
    if (error.code && statusByCode[error.code]) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: statusByCode[error.code] });
    }
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Child password reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
