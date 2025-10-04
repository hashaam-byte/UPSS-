// app/api/protected/headadmin/messages/school-admins/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const authResult = await requireAuth(['headadmin']);
    
    if (!authResult.authenticated || authResult.user?.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all school admins with their school information
    const admins = await prisma.user.findMany({
      where: {
        role: 'admin',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { school: { name: 'asc' } },
        { firstName: 'asc' }
      ]
    });

    return NextResponse.json({
      admins: admins,
      total: admins.length
    });

  } catch (error) {
    console.error('Error fetching school admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school admins' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}