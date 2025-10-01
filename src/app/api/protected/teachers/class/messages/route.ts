import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth( ['teacher']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id }
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    const students = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: teacherProfile.coordinatorClass || undefined
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentProfile: {
          select: { className: true, studentId: true }
        }
      }
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error('Error fetching class students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
