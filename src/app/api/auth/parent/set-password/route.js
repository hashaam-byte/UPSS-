// /api/auth/parent/set-password
// Step 3: consumes the verification ticket from /verify-otp and either
// creates a new parent account (first login) or updates the password on an
// existing one (forgot-password). Requires a valid ticket — password can
// never be set without having proven phone ownership via OTP first.
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticket, password } = body;

    if (!ticket || !password) {
      return NextResponse.json({ error: 'ticket and password are required' }, { status: 400 });
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json({ error: 'Weak password', details: passwordCheck.errors }, { status: 400 });
    }

    let decoded;
    try {
      decoded = jwt.verify(ticket, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Verification ticket is invalid or expired. Please verify your code again.' }, { status: 401 });
    }

    if (decoded.type !== 'otp_ticket') {
      return NextResponse.json({ error: 'Invalid ticket' }, { status: 401 });
    }

    const { phone, purpose, schoolId } = decoded;
    const passwordHash = await bcrypt.hash(password, 12);

    if (purpose === 'IDENTITY_VERIFICATION') {
      // First-time signup: create the parent's User + ParentProfile + links to every
      // matching student in this school.
      const existing = await prisma.parentProfile.findFirst({ where: { phone, schoolId } });
      if (existing) {
        return NextResponse.json({ error: 'An account already exists for this phone number. Use forgot password instead.' }, { status: 409 });
      }

      const matchingStudents = await prisma.studentProfile.findMany({
        where: { parentPhone: phone },
        include: { user: { select: { id: true, schoolId: true, firstName: true, lastName: true } } }
      });
      const studentsInSchool = matchingStudents.filter(sp => sp.user.schoolId === schoolId);

      if (studentsInSchool.length === 0) {
        return NextResponse.json({ error: 'No students found for this phone number at this school' }, { status: 404 });
      }

      // Placeholder unique email — parent accounts are phone-first and don't require one.
      const placeholderEmail = `parent-${phone.replace(/\D/g, '')}-${crypto.randomBytes(3).toString('hex')}@noemail.uplus.internal`;

      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            firstName: 'Parent',
            lastName: `of ${studentsInSchool[0].user.firstName}`,
            email: placeholderEmail,
            passwordHash,
            role: 'PARENT',
            schoolId,
            phone,
            isEmailVerified: false,
            isActive: true
          }
        });

        const parentProfile = await tx.parentProfile.create({
          data: { userId: user.id, schoolId, phone, isVerified: true }
        });

        await tx.parentStudentLink.createMany({
          data: studentsInSchool.map(sp => ({
            parentId: parentProfile.id,
            studentId: sp.user.id
          }))
        });

        return { user, parentProfile };
      });

      return NextResponse.json({
        success: true,
        message: 'Account created successfully. You can now log in.',
        data: {
          childrenLinked: studentsInSchool.length
        }
      }, { status: 201 });
    }

    if (purpose === 'PASSWORD_RESET') {
      const parentProfile = await prisma.parentProfile.findFirst({ where: { phone, schoolId } });
      if (!parentProfile) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      await prisma.user.update({
        where: { id: parentProfile.userId },
        data: { passwordHash }
      });

      // Invalidate existing sessions so a stolen session can't survive a password reset
      await prisma.userSession.deleteMany({ where: { userId: parentProfile.userId } });

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully. Please log in with your new password.'
      });
    }

    return NextResponse.json({ error: 'This ticket cannot be used to set a password' }, { status: 400 });

  } catch (error) {
    console.error('Parent set-password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
