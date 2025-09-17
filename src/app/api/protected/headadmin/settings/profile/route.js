// pages/api/protected/headadmin/settings/profile.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get current profile
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('Profile settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, email, phone, currentPassword, newPassword } = body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ 
        error: 'First name, last name, and email are required' 
      }, { status: 400 });
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        id: { not: user.id }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    const updateData = {
      firstName,
      lastName,
      email,
      phone: phone || null
    };

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ 
          error: 'Current password is required to change password' 
        }, { status: 400 });
      }

      // Verify current password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      const isValidPassword = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      if (newPassword.length < 8) {
        return NextResponse.json({ 
          error: 'New password must be at least 8 characters long' 
        }, { status: 400 });
      }

      // Hash new password
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'profile_updated',
        resource: 'user',
        resourceId: user.id,
        description: `Updated profile information${newPassword ? ' and password' : ''}`,
        metadata: {
          updatedFields: Object.keys(updateData).filter(key => key !== 'passwordHash')
        }
      }
    });

    return NextResponse.json({
      success: true,
      profile: updatedUser
    });

  } catch (error) {
    console.error('Profile settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
