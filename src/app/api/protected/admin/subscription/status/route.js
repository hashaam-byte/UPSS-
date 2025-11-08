// /app/api/protected/admin/subscription/status/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Authenticate and get the current admin user
    const user = await requireAuth(['admin']);

    // IMPORTANT: This ensures we only get data for the authenticated user's school
    // Each school admin can ONLY see their own school's subscription data
    const schoolId = user.school.id;

    // Get school subscription details - scoped to THIS school only
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        subscriptionIsActive: true,
        maxStudents: true,
        maxTeachers: true,
        customNextPaymentDays: true,
        recurringPaymentMonths: true // Added this field
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const now = new Date();
    const expiresAt = new Date(school.subscriptionExpiresAt);

    // Calculate terms remaining (assuming 3 months per term)
    const msPerTerm = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months
    const termsRemaining = Math.max(0, Math.ceil((expiresAt - now) / msPerTerm));

    // Get current user counts - ONLY for this specific school
    const [studentCount, teacherCount, adminCount] = await Promise.all([
      prisma.user.count({
        where: {
          schoolId: schoolId, // Explicitly use schoolId
          role: 'student',
          isActive: true
        }
      }),
      prisma.user.count({
        where: {
          schoolId: schoolId, // Explicitly use schoolId
          role: 'teacher',
          isActive: true
        }
      }),
      prisma.user.count({
        where: {
          schoolId: schoolId, // Explicitly use schoolId
          role: 'admin',
          isActive: true
        }
      })
    ]);

    // Calculate estimated cost based on pricing model
    const totalUsers = studentCount + teacherCount + adminCount;
    const individualPricePerUser = 250; // ₦250 per user
    const bulkPricePerUser = 200; // ₦200 per user (bulk discount)
    
    // Bulk pricing: flat rate for 600+ users, otherwise per-user
    const bulkCost = totalUsers > 600 ? 200000 : totalUsers * bulkPricePerUser;
    const individualCost = totalUsers * individualPricePerUser;

    // Get pending invoices - ONLY for this specific school
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        schoolId: schoolId, // Explicitly use schoolId
        status: 'pending'
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Calculate days till next payment
    // Priority: customNextPaymentDays > calculated from subscriptionExpiresAt
    let daysTillNextPayment = 0;
    
    if (school.customNextPaymentDays !== null && school.customNextPaymentDays !== undefined) {
      // Use custom days if explicitly set by system
      daysTillNextPayment = school.customNextPaymentDays;
    } else if (school.subscriptionExpiresAt) {
      // Calculate from expiration date
      const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      daysTillNextPayment = Math.max(0, daysRemaining);
    }

    // Determine subscription status
    const isExpired = daysTillNextPayment <= 0;
    const isExpiringSoon = daysTillNextPayment > 0 && daysTillNextPayment <= 30;

    return NextResponse.json({
      success: true,
      subscription: {
        // School identification
        schoolId: school.id,
        schoolName: school.name,
        
        // Subscription details
        subscriptionPlan: school.subscriptionPlan,
        subscriptionExpiresAt: school.subscriptionExpiresAt,
        subscriptionIsActive: school.subscriptionIsActive && !isExpired,
        
        // Time remaining
        termsRemaining,
        daysTillNextPayment,
        isExpired,
        isExpiringSoon,
        
        // Limits
        maxStudents: school.maxStudents,
        maxTeachers: school.maxTeachers,
        
        // Current usage - THIS SCHOOL ONLY
        currentUsers: {
          students: studentCount,
          teachers: teacherCount,
          admins: adminCount,
          total: totalUsers
        },
        
        // Pricing information
        pricing: {
          individual: {
            pricePerUser: individualPricePerUser,
            totalCost: individualCost
          },
          bulk: {
            pricePerUser: bulkPricePerUser,
            totalCost: bulkCost,
            savings: individualCost - bulkCost
          },
          isOverLimit: totalUsers > (school.maxStudents + school.maxTeachers)
        },
        
        // Pending invoices - THIS SCHOOL ONLY
        pendingInvoices: pendingInvoices.map(invoice => ({
          id: invoice.id,
          amount: invoice.amount.toString(), // Convert Decimal to string
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
        { error: 'Access denied. Only school admins can access subscription data.' },
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