// app/api/protected/teachers/director/settings/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({
      success: true,
      data: {
        settings: settings || {
          emailNotifications: true,
          assignmentReminders: true,
          gradeNotifications: true
        }
      }
    });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Type and data required' },
        { status: 400 }
      );
    }

    // Update Profile
    if (type === 'profile') {
      const { firstName, lastName, email, phone, qualification, experienceYears } = data;

      // Check if email is already used by another user
      if (email !== user.email) {
        const existingUser = await prisma.user.findFirst({
          where: {
            email,
            schoolId: user.schoolId,
            id: { not: user.id }
          }
        });

        if (existingUser) {
          return NextResponse.json(
            { success: false, error: 'Email already in use' },
            { status: 400 }
          );
        }
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName,
          lastName,
          email,
          phone
        }
      });

      // Update teacher profile if exists
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: user.id }
      });

      if (teacherProfile) {
        await prisma.teacherProfile.update({
          where: { userId: user.id },
          data: {
            qualification,
            experienceYears: parseInt(experienceYears) || 0
          }
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Profile updated successfully'
      });
    }

    // Change Password
    if (type === 'password') {
      const { currentPassword, newPassword } = data;

      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { success: false, error: 'Current and new passwords required' },
          { status: 400 }
        );
      }

      // Verify current password
      const userWithPassword = await prisma.user.findUnique({
        where: { id: user.id },
        select: { passwordHash: true }
      });

      const isValidPassword = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);

      if (!isValidPassword) {
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
        data: {
          passwordHash: newPasswordHash
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      });
    }

    // Update Notification Settings
    if (type === 'notifications') {
      const { emailNotifications, assignmentReminders, gradeNotifications } = data;

      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {
          emailNotifications,
          assignmentReminders,
          gradeNotifications
        },
        create: {
          userId: user.id,
          emailNotifications,
          assignmentReminders,
          gradeNotifications
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Notification settings updated'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid update type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}