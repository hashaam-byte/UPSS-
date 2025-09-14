
// /app/api/auth/reset-password/confirm/route.js
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, newPassword, confirmPassword } = body;

    // Validate required fields
    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: token,
        expiresAt: {
          gt: new Date()
        },
        usedAt: null
      },
      include: {
        user: true
      }
    });

    if (!resetTokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password and reset login attempts
    await prisma.user.update({
      where: { id: resetTokenRecord.userId },
      data: {
        passwordHash: newPasswordHash,
        loginAttempts: 0,
        lockUntil: null
      }
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetTokenRecord.id },
      data: {
        usedAt: new Date()
      }
    });

    // Invalidate all existing sessions for this user
    await prisma.userSession.updateMany({
      where: { userId: resetTokenRecord.userId },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successful. Please log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset confirm error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
