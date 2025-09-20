import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Use requireAuth to get the user object directly
    const user = await requireAuth(['admin', 'headadmin']);

    // For non-head admins, filter by school
    const whereClause = {
      isActive: true,
      ...(user.role !== 'headadmin' && { schoolId: user.school.id })
    };

    const subjects = await prisma.subject.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        classes: true,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      subjects
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
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}