import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PATCH(request, { params }) {
  try {
    // Verify authentication and admin role
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = authResult;
    if (user.role !== 'admin' && user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { isActive } = body;

    // Validate input
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean value' },
        { status: 400 }
      );
    }

    // For non-head admins, ensure they can only update users from their school
    const whereClause = {
      id: userId,
      ...(user.role !== 'headadmin' && { schoolId: user.schoolId })
    };

    const existingUser = await prisma.user.findFirst({
      where: whereClause
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent self-deactivation
    if (userId === user.id && !isActive) {
      return NextResponse.json(
        { error: 'Cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Prevent deactivating the last admin in a school (for non-head admins)
    if (existingUser.role === 'admin' && !isActive && user.role !== 'headadmin') {
      const activeAdminCount = await prisma.user.count({
        where: {
          schoolId: existingUser.schoolId,
          role: 'admin',
          isActive: true,
          id: { not: userId } // Exclude the current user being deactivated
        }
      });

      if (activeAdminCount === 0) {
        return NextResponse.json(
          { error: 'Cannot deactivate the last active admin in the school' },
          { status: 400 }
        );
      }
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    });

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: updatedUser.id,
        isActive: updatedUser.isActive
      }
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}