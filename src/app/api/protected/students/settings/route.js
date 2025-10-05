// /app/api/protected/students/settings/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth(['student']);
    
    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          emailNotifications: true,
          assignmentReminders: true,
          gradeNotifications: true,
          profileVisibility: true,
          showPerformance: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['student']);
    const body = await request.json();

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        userId: user.id,
        ...body
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedSettings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// /app/api/protected/students/change-password/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const user = await requireAuth(['student']);
    const { currentPassword, newPassword } = await request.json();

    // Get user with password hash
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true }
    });

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash }
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}