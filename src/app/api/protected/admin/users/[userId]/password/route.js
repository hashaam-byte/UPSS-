// /app/api/protected/admin/users/[userId]/password/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function PUT(request, { params }) {
  try {
    const currentUser = await requireAuth(['admin', 'headadmin']);
    const { userId } = params;
    const { newPassword } = await request.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Build where clause for access control
    const where = { id: userId };
    if (currentUser.role === 'admin') {
      where.schoolId = currentUser.school.id;
    }

    const user = await prisma.user.findFirst({ where });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password and invalidate all user sessions
    await Promise.all([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      }),
      prisma.userSession.updateMany({
        where: { userId: userId },
        data: { isActive: false }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Update password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}
