// /app/api/protected/headadmin/schools/[id]/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    
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

    // Fetch school with detailed information
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLogin: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            amount: true,
            status: true,
            billingPeriod: true,
            studentCount: true,
            teacherCount: true,
            adminCount: true,
            createdAt: true,
            paidAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
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

    // Count users by role
    const userStats = {
      total: school.users.length,
      active: school.users.filter(u => u.isActive).length,
      admins: school.users.filter(u => u.role === 'admin').length,
      teachers: school.users.filter(u => u.role === 'teacher').length,
      students: school.users.filter(u => u.role === 'student').length
    };

    // Calculate billing statistics
    const paidInvoices = school.invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const pendingInvoices = school.invoices.filter(inv => inv.status === 'pending').length;

    const billingStats = {
      totalRevenue,
      totalInvoices: school.invoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices
    };

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = school.users.filter(u => 
      new Date(u.createdAt) > thirtyDaysAgo
    ).length;

    const activityStats = {
      newUsersLast30Days: recentUsers,
      lastActivity: school.users.reduce((latest, user) => {
        const userLogin = user.lastLogin ? new Date(user.lastLogin) : null;
        return userLogin && (!latest || userLogin > latest) ? userLogin : latest;
      }, null)
    };

    return NextResponse.json({
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        email: school.email,
        phone: school.phone,
        address: school.address,
        website: school.website,
        isActive: school.isActive,
        subscriptionPlan: school.subscriptionPlan,
        subscriptionIsActive: school.subscriptionIsActive,
        subscriptionExpiresAt: school.subscriptionExpiresAt,
        maxStudents: school.maxStudents,
        maxTeachers: school.maxTeachers,
        allowStudentRegistration: school.allowStudentRegistration,
        requireEmailVerification: school.requireEmailVerification,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt
      },
      users: school.users,
      invoices: school.invoices,
      stats: {
        users: userStats,
        billing: billingStats,
        activity: activityStats
      }
    });

  } catch (error) {
    console.error('Failed to fetch school details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}