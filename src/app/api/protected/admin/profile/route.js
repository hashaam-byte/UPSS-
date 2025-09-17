import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const user = await requireAuth(['admin']);
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
    const user = await requireAuth(['admin']);
    const data = await request.json();

    // Update profile fields
    const updateData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
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
