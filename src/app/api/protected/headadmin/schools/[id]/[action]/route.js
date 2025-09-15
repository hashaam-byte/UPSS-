// /app/api/protected/headadmin/schools/[id]/[action]/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id: schoolId, action } = params;

    if (!schoolId || !action) {
      return NextResponse.json(
        { error: 'School ID and action are required' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['suspend', 'activate'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Determine new status
    const newStatus = action === 'activate';

    // Check if action is necessary
    if (school.isActive === newStatus) {
      return NextResponse.json(
        { error: `School is already ${action === 'activate' ? 'active' : 'suspended'}` },
        { status: 400 }
      );
    }

    // Perform the action in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update school status
      const updatedSchool = await tx.school.update({
        where: { id: schoolId },
        data: { isActive: newStatus }
      });

      // If suspending, deactivate all user sessions for this school
      if (action === 'suspend') {
        await tx.userSession.updateMany({
          where: {
            user: {
              schoolId: schoolId
            }
          },
          data: { isActive: false }
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: `school_${action}d`,
          resource: 'school',
          resourceId: schoolId,
          description: `${action === 'activate' ? 'Activated' : 'Suspended'} school "${school.name}"`,
          metadata: {
            schoolSlug: school.slug,
            previousStatus: school.isActive,
            newStatus: newStatus
          }
        }
      });

      // Create notification for school admins
      const schoolAdmins = await tx.user.findMany({
        where: {
          schoolId: schoolId,
          role: 'admin',
          isActive: true
        },
        select: { id: true }
      });

      const notificationPromises = schoolAdmins.map(admin =>
        tx.notification.create({
          data: {
            userId: admin.id,
            title: `School ${action === 'activate' ? 'Activated' : 'Suspended'}`,
            content: `Your school has been ${action === 'activate' ? 'activated' : 'suspended'} by the head administrator. ${
              action === 'suspend' 
                ? 'Please contact support if you believe this is an error.'
                : 'You can now resume normal operations.'
            }`,
            type: action === 'activate' ? 'success' : 'warning',
            priority: 'high'
          }
        })
      );

      await Promise.all(notificationPromises);

      return updatedSchool;
    });

    return NextResponse.json({
      success: true,
      message: `School ${action === 'activate' ? 'activated' : 'suspended'} successfully`,
      school: {
        id: result.id,
        name: result.name,
        isActive: result.isActive
      }
    });

  } catch (error) {
    console.error(`Failed to ${params?.action} school:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}