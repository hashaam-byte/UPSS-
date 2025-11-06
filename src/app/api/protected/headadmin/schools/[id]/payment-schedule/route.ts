// app/api/protected/headadmin/schools/[schoolId]/payment-schedule/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {

    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Forbidden - Only head administrators can modify payment schedules' },
        { status: 403 }
      );
    }

    const { schoolId } = params;
    if (!schoolId || typeof schoolId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid school ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { customNextPaymentDays } = body;

    // Validate customNextPaymentDays
    if (customNextPaymentDays === undefined || customNextPaymentDays === null) {
      return NextResponse.json(
        { error: 'customNextPaymentDays is required' },
        { status: 400 }
      );
    }

    const days = parseInt(customNextPaymentDays);
    if (isNaN(days)) {
      return NextResponse.json(
        { error: 'customNextPaymentDays must be a valid number' },
        { status: 400 }
      );
    }

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'customNextPaymentDays must be between 1 and 365 days' },
        { status: 400 }
      );
    }
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        customNextPaymentDays: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true
      }
    });

    if (!existingSchool) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const currentDate = new Date();
    const currentExpiry = new Date(existingSchool.subscriptionExpiresAt);
    
    const baseDate = currentExpiry < currentDate ? currentDate : currentExpiry;
    const newExpiryDate = new Date(baseDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + days);

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        customNextPaymentDays: days,
        subscriptionExpiresAt: newExpiryDate,
        subscriptionIsActive: true, // Reactivate if updating schedule
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        slug: true,
        customNextPaymentDays: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true,
        subscriptionPlan: true,
        updatedAt: true
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'update_payment_schedule',
        resource: 'school',
        resourceId: schoolId,
        description: `Updated payment schedule for ${existingSchool.name} from ${existingSchool.customNextPaymentDays || 30} to ${days} days`,
        metadata: {
          previousDays: existingSchool.customNextPaymentDays || 30,
          newDays: days,
          previousExpiry: existingSchool.subscriptionExpiresAt.toISOString(),
          newExpiry: newExpiryDate.toISOString(),
          schoolName: existingSchool.name
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      }
    });

    try {
      // Find school admin users
      const schoolAdmins = await prisma.user.findMany({
        where: {
          schoolId: schoolId,
          role: 'admin',
          isActive: true
        },
        select: { id: true }
      });

      if (schoolAdmins.length > 0) {
        await prisma.notification.createMany({
          data: schoolAdmins.map(admin => ({
            userId: admin.id,
            schoolId: schoolId,
            title: 'Payment Schedule Updated',
            content: `Your payment schedule has been updated to ${days} days. Your next payment is due on ${newExpiryDate.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}.`,
            type: 'info',
            priority: 'high',
            actionUrl: '/admin/subscription',
            actionText: 'View Subscription'
          }))
        });
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(
      {
        success: true,
        message: `Payment schedule updated successfully for ${updatedSchool.name}`,
        school: updatedSchool,
        daysUntilPayment: Math.ceil(
          (newExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating payment schedule:', error);
    
    // Handle Prisma-specific errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'School not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error occurred while updating payment schedule',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Forbidden - Only head administrators can view payment schedules' },
        { status: 403 }
      );
    }

    // 3. Validate and fetch school
    const { schoolId } = params;
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        customNextPaymentDays: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true,
        subscriptionPlan: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const currentDate = new Date();
    const expiryDate = new Date(school.subscriptionExpiresAt);
    const daysUntilPayment = Math.ceil(
      (expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      success: true,
      school: {
        ...school,
        daysUntilPayment,
        isExpired: daysUntilPayment < 0,
        isExpiringSoon: daysUntilPayment > 0 && daysUntilPayment <= 30
      }
    });

  } catch (error) {
    console.error('Error fetching payment schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}