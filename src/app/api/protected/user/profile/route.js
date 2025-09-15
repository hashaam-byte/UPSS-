// /app/api/protected/user/profile/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await requireAuth();
    
    return NextResponse.json({
      success: true,
      user: user
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

    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    const { firstName, lastName, phone, address, avatar } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        phone: phone?.trim(),
        address: address?.trim(),
        avatar: avatar
      },
      include: {
        school: true,
        studentProfile: user.role === 'student',
        teacherProfile: user.role === 'teacher',
        adminProfile: user.role === 'admin' ? {
          include: { permissions: true }
        } : false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        phone: updatedUser.phone,
        address: updatedUser.address,
        avatar: updatedUser.avatar,
        isEmailVerified: updatedUser.isEmailVerified,
        school: updatedUser.school,
        profile: updatedUser.studentProfile || updatedUser.teacherProfile || updatedUser.adminProfile
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}