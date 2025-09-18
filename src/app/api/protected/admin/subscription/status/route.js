// /app/api/protected/admin/subscription/status/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);

    // Get school subscription details
    const school = await prisma.school.findUnique({
      where: { id: user.school.id },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true,
        maxStudents: true,
        maxTeachers: true,
        customNextPaymentDays: true // Include customNextPaymentDays
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Calculate terms remaining (assuming 3 months per term)
    const now = new Date();
    const expiresAt = new Date(school.subscriptionExpiresAt);
    const msPerTerm = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months
    const termsRemaining = Math.max(0, Math.ceil((expiresAt - now) / msPerTerm));

    // Get current user counts
    const [studentCount, teacherCount] = await Promise.all([
      prisma.user.count({
        where: {
          schoolId: school.id,
          role: 'student',
          isActive: true
        }
      }),
      prisma.user.count({
        where: {
          schoolId: school.id,
          role: 'teacher',
          isActive: true
        }
      })
    ]);

    // Calculate estimated cost
    const totalUsers = studentCount + teacherCount;
    const pricePerUser = 250; // ₦250 per user
    const estimatedCost = totalUsers > 600 ? 200000 : totalUsers * pricePerUser;

    // Get pending invoices
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        schoolId: school.id,
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Use customNextPaymentDays if set, otherwise calculate from subscriptionExpiresAt
    let daysTillNextPayment = null;
    if (school.customNextPaymentDays != null) {
      daysTillNextPayment = school.customNextPaymentDays;
    } else if (school.subscriptionExpiresAt) {
      daysTillNextPayment = Math.max(0, Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24)));
    }

    return NextResponse.json({
      success: true,
      subscription: {
        ...school,
        termsRemaining,
        daysTillNextPayment, // Add daysTillNextPayment to response
        currentUsers: {
          students: studentCount,
          teachers: teacherCount,
          total: totalUsers
        },
        pricing: {
          pricePerUser,
          estimatedMonthlyCost: estimatedCost,
          isOverLimit: totalUsers > (school.maxStudents + school.maxTeachers)
        },
        pendingInvoices: pendingInvoices.map(invoice => ({
          id: invoice.id,
          amount: invoice.amount,
          description: invoice.description,
          createdAt: invoice.createdAt,
          dueDate: invoice.dueDate
        }))
      }
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

    console.error('Get subscription status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}