// src/app/api/protected/headadmin/schools/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['headadmin']);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by status
    if (status !== 'all') {
      const now = new Date();
      if (status === 'active') {
        where.subscriptionIsActive = true;
        where.subscriptionExpiresAt = { gt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
      } else if (status === 'expiring') {
        where.subscriptionIsActive = true;
        where.subscriptionExpiresAt = {
          gt: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        };
      } else if (status === 'expired') {
        where.OR = [
          { subscriptionIsActive: false },
          { subscriptionExpiresAt: { lte: now } }
        ];
      } else if (status === 'suspended') {
        where.isActive = false;
      }
    }

    // Fetch schools with user count and all necessary fields
    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          email: true,
          phone: true,
          address: true,
          website: true,
          logo: true,
          isActive: true,
          subscriptionPlan: true,
          subscriptionExpiresAt: true,
          subscriptionIsActive: true,
          customNextPaymentDays: true,
          maxStudents: true,
          maxTeachers: true,
          allowStudentRegistration: true,
          requireEmailVerification: true,
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
      }),
      prisma.school.count({ where })
    ]);

    // Calculate days until expiry for each school
    const now = new Date();
    const schoolsWithDays = schools.map(school => {
      const expiresAt = new Date(school.subscriptionExpiresAt);
      const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
      
      return {
        id: school.id,
        name: school.name,
        slug: school.slug,
        email: school.email,
        phone: school.phone,
        address: school.address,
        website: school.website,
        logo: school.logo,
        isActive: school.isActive,
        subscriptionPlan: school.subscriptionPlan,
        subscriptionIsActive: school.subscriptionIsActive,
        subscriptionExpiresAt: school.subscriptionExpiresAt,
        maxStudents: school.maxStudents,
        maxTeachers: school.maxTeachers,
        allowStudentRegistration: school.allowStudentRegistration,
        requireEmailVerification: school.requireEmailVerification,
        createdAt: school.createdAt,
        updatedAt: school.updatedAt,
        userCount: school._count.users,
        daysTillNextPayment: daysLeft
      };
    });

    // Calculate summary counts
    const activeCount = schools.filter(s => s.isActive).length;
    const suspendedCount = schools.filter(s => !s.isActive).length;

    return NextResponse.json({
      success: true,
      schools: schoolsWithDays,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalCount: total,
        activeCount,
        suspendedCount
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    console.error('Get schools error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}