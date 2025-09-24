// /app/api/protected/headadmin/schools/[id]/extend-trial/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  let user = null; // Declare at top level for error handling
  
  try {
    user = await getCurrentUser();
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id: schoolId } = params;

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Parse request body for custom extension days
    let extensionDays = 30; // Default extension
    try {
      const body = await request.json();
      if (body.extensionDays && typeof body.extensionDays === 'number') {
        extensionDays = Math.max(1, Math.min(365, body.extensionDays)); // Between 1-365 days
      }
    } catch {
      // Use default if JSON parsing fails
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionIsActive: true,
        subscriptionExpiresAt: true
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Calculate new expiration date
    const currentExpiration = new Date(school.subscriptionExpiresAt);
    const now = new Date();
    
    // If subscription has already expired, extend from current date
    // Otherwise, extend from current expiration date
    const baseDate = currentExpiration > now ? currentExpiration : now;
    const newExpirationDate = new Date(baseDate);
    newExpirationDate.setDate(newExpirationDate.getDate() + extensionDays);

    // Get school admins before transaction to reduce transaction time
    const schoolAdmins = await prisma.user.findMany({
      where: {
        schoolId: schoolId,
        role: 'admin',
        isActive: true
      },
      select: { id: true }
    });

    // Update school subscription with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      // Update school
      const updatedSchool = await tx.school.update({
        where: { id: schoolId },
        data: {
          subscriptionExpiresAt: newExpirationDate,
          subscriptionIsActive: true, // Ensure it's active if extending
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'EXTEND_SCHOOL_TRIAL',
          resource: 'school',
          resourceId: schoolId,
          description: `Extended trial period for school: ${school.name} by ${extensionDays} days`,
          metadata: {
            schoolName: school.name,
            schoolSlug: school.slug,
            extensionDays: extensionDays,
            previousExpiration: school.subscriptionExpiresAt,
            newExpiration: newExpirationDate,
            wasActive: school.subscriptionIsActive,
            extendedAt: new Date().toISOString(),
            extendedBy: user.email
          }
        }
      });

      // Create notifications for school admins (batch create for efficiency)
      if (schoolAdmins.length > 0) {
        const notificationData = schoolAdmins.map(admin => ({
          userId: admin.id,
          title: 'Trial Period Extended',
          content: `Great news! Your trial period has been extended by ${extensionDays} days. Your new expiration date is ${newExpirationDate.toLocaleDateString()}. You can continue using all premium features until then.`,
          type: 'success',
          priority: 'high'
        }));

        await tx.notification.createMany({
          data: notificationData
        });
      }

      return updatedSchool;
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    });

    return NextResponse.json({
      success: true,
      message: `Trial period extended by ${extensionDays} days`,
      school: {
        id: result.id,
        name: result.name,
        subscriptionIsActive: result.subscriptionIsActive,
        subscriptionExpiresAt: result.subscriptionExpiresAt
      },
      extension: {
        days: extensionDays,
        previousExpiration: school.subscriptionExpiresAt,
        newExpiration: newExpirationDate,
        totalDaysRemaining: Math.ceil((newExpirationDate - now) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Error extending trial period:', error);
    
    // Create error audit log with proper error handling
    try {
      if (user?.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'EXTEND_SCHOOL_TRIAL_FAILED',
            resource: 'school',
            resourceId: params.id,
            description: `Failed to extend trial period: ${error.message}`,
            metadata: {
              error: error.message,
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    } catch (auditError) {
      console.error('Failed to create error audit log:', auditError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to extend trial period',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}