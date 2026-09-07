import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await requireAuth(['ADMIN']);
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });
    return NextResponse.json({ profile: dbUser });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['ADMIN']);
    const data = await request.json();

    // Update profile fields — email is intentionally excluded: it's used as
    // a stable login identifier and platform-side contact, so it's read-only
    // here even though the request body may include it.
    const updateData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone
    };

    // Handle password change if requested
    if (data.currentPassword && data.newPassword) {
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      const valid = await bcrypt.compare(data.currentPassword, dbUser.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      if (data.newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(data.newPassword, 12);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
