import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['student']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const teachers = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'teacher',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        teacherProfile: {
          select: {
            coordinatorClass: true,
            department: true,
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    return NextResponse.json({ success: true, teachers });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
  }
}
