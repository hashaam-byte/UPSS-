// /app/api/protected/headadmin/schools/recent/route.js
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

    // Fetch recent schools with user counts
    const schools = await prisma.school.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    // Format the response
    const formattedSchools = schools.map(school => ({
      id: school.id,
      name: school.name,
      slug: school.slug,
      isActive: school.isActive,
      createdAt: school.createdAt,
      userCount: school._count.users
    }));

    return NextResponse.json({
      schools: formattedSchools
    });

  } catch (error) {
    console.error('Failed to fetch recent schools:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}