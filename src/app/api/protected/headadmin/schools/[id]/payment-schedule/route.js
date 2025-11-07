// src/app/api/protected/headadmin/schools/[id]/payment-schedule/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth(['headadmin']);
    const { id } = params;
    const body = await request.json();
    const { 
      customNextPaymentDays, 
      exactExpiryDate,
      recurringMonths // New: How many months between payments
    } = body;

    // Validate input - either use days OR exact date
    if (!customNextPaymentDays && !exactExpiryDate) {
      return NextResponse.json(
        { error: 'Either customNextPaymentDays or exactExpiryDate is required' },
        { status: 400 }
      );
    }

    // Fetch existing school
    const existingSchool = await prisma.school.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        customNextPaymentDays: true,
        recurringPaymentMonths: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true
      }
    });

    if (!existingSchool) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    let newExpiryDate;
    let days = null;
    let months = recurringMonths || existingSchool.recurringPaymentMonths || null;

    // If exact date is provided, use it
    if (exactExpiryDate) {
      newExpiryDate = new Date(exactExpiryDate);
      
      // Validate the date
      if (isNaN(newExpiryDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }

      // Calculate days from now for display purposes
      const currentDate = new Date();
      days = Math.ceil((newExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    } 
    // Otherwise use days
    else if (customNextPaymentDays) {
      days = parseInt(customNextPaymentDays);
      if (isNaN(days) || days < 1 || days > 3650) { // Allow up to ~10 years
        return NextResponse.json(
          { error: 'customNextPaymentDays must be between 1 and 3650 days' },
          { status: 400 }
        );
      }

      // Calculate new expiry date from current date or existing expiry
      const currentDate = new Date();
      const currentExpiry = new Date(existingSchool.subscriptionExpiresAt);
      const baseDate = currentExpiry < currentDate ? currentDate : currentExpiry;
      newExpiryDate = new Date(baseDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + days);
    }

    // Validate recurring months if provided
    if (months !== null) {
      const monthsInt = parseInt(months);
      if (isNaN(monthsInt) || monthsInt < 1 || monthsInt > 120) {
        return NextResponse.json(
          { error: 'recurringMonths must be between 1 and 120 months' },
          { status: 400 }
        );
      }
      months = monthsInt;
    }

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id },
      data: {
        ...(days !== null && { customNextPaymentDays: days }),
        ...(months !== null && { recurringPaymentMonths: months }),
        subscriptionExpiresAt: newExpiryDate,
        subscriptionIsActive: true,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        slug: true,
        customNextPaymentDays: true,
        recurringPaymentMonths: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true,
        subscriptionPlan: true,
        updatedAt: true
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'update_payment_schedule',
        resource: 'school',
        resourceId: id,
        description: `Updated payment schedule for ${existingSchool.name}. ${
          exactExpiryDate 
            ? `Set exact expiry date to ${newExpiryDate.toISOString()}`
            : `Updated from ${existingSchool.customNextPaymentDays || 30} to ${days} days`
        }${months ? `. Recurring every ${months} months` : ''}`,
        metadata: {
          previousDays: existingSchool.customNextPaymentDays || 30,
          newDays: days,
          recurringMonths: months,
          previousExpiry: existingSchool.subscriptionExpiresAt.toISOString(),
          newExpiry: newExpiryDate.toISOString(),
          schoolName: existingSchool.name,
          setByExactDate: !!exactExpiryDate
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'
      }
    });

    // Create notifications for school admins
    try {
      const schoolAdmins = await prisma.user.findMany({
        where: {
          schoolId: id,
          role: 'admin',
          isActive: true
        },
        select: { id: true }
      });

      if (schoolAdmins.length > 0) {
        const formattedDate = newExpiryDate.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        await prisma.notification.createMany({
          data: schoolAdmins.map(admin => ({
            userId: admin.id,
            schoolId: id,
            title: 'Payment Schedule Updated',
            content: `Your subscription schedule has been updated. ${
              months 
                ? `Your subscription will renew every ${months} month${months > 1 ? 's' : ''}.` 
                : ''
            } Next payment is due on ${formattedDate}.`,
            type: 'info',
            priority: 'high',
            actionUrl: '/protected/admin/subscription',
            actionText: 'View Subscription'
          }))
        });
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    const currentDate = new Date();
    return NextResponse.json({
      success: true,
      message: `Payment schedule updated successfully for ${updatedSchool.name}`,
      school: updatedSchool,
      daysUntilPayment: Math.ceil(
        (newExpiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      ),
      exactExpiryDate: newExpiryDate.toISOString(),
      recurringMonths: months
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    console.error('Error updating payment schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['headadmin']);
    const { id } = params;

    const school = await prisma.school.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        customNextPaymentDays: true,
        recurringPaymentMonths: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true,
        subscriptionPlan: true,
        maxStudents: true,
        maxTeachers: true,
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
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
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
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    console.error('Error fetching payment schedule:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}