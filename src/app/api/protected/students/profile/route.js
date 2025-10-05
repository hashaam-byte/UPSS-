// /app/api/protected/students/profile/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth(['student']);
    
    const studentData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    if (!studentData) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: studentData.id,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        email: studentData.email,
        username: studentData.username,
        avatar: studentData.avatar,
        phone: studentData.phone,
        address: studentData.address,
        dateOfBirth: studentData.dateOfBirth,
        gender: studentData.gender,
        studentProfile: studentData.studentProfile,
        school: studentData.school
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['student']);
    const body = await request.json();
    
    const { phone, address, parentName, parentPhone, parentEmail } = body;

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        address
      },
      include: {
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    // Update student profile parent info
    if (updatedUser.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: updatedUser.studentProfile.id },
        data: {
          parentName,
          parentPhone,
          parentEmail
        }
      });
    }

    // Fetch updated data
    const updatedData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
            logo: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedData.id,
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        email: updatedData.email,
        username: updatedData.username,
        avatar: updatedData.avatar,
        phone: updatedData.phone,
        address: updatedData.address,
        dateOfBirth: updatedData.dateOfBirth,
        gender: updatedData.gender,
        studentProfile: updatedData.studentProfile,
        school: updatedData.school
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}