// /app/api/protected/headadmin/schools/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch all schools with user counts and subscription info
    const schools = await prisma.school.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        isActive: true,
        subscriptionPlan: true,
        subscriptionIsActive: true,
        subscriptionExpiresAt: true,
        maxStudents: true,
        maxTeachers: true,
        allowStudentRegistration: true,
        requireEmailVerification: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: {
              where: {
                isActive: true
              }
            }
          }
        }
      }
    });

    // Format the response
    const formattedSchools = schools.map(school => ({
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
      updatedAt: school.updatedAt,
      userCount: school._count.users
    }));

    return NextResponse.json({
      schools: formattedSchools,
      totalCount: schools.length,
      activeCount: schools.filter(s => s.isActive).length,
      suspendedCount: schools.filter(s => !s.isActive).length
    });

  } catch (error) {
    console.error('Failed to fetch schools:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}