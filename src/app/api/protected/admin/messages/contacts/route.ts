import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            coordinatorClass: true
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    return NextResponse.json({ success: true, contacts: teachers });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}
