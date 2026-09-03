// /api/protected/parent/dashboard
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth(['PARENT']);

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
      include: {
        children: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                studentProfile: {
                  select: {
                    studentId: true,
                    className: true,
                    section: true,
                    currentStream: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const children = parentProfile.children.map(link => ({
      id: link.student.id,
      name: `${link.student.firstName} ${link.student.lastName}`,
      avatar: link.student.avatar,
      studentId: link.student.studentProfile?.studentId,
      className: link.student.studentProfile?.className,
      section: link.student.studentProfile?.section,
      stream: link.student.studentProfile?.currentStream,
      relationship: link.relationship
    }));

    return NextResponse.json({
      success: true,
      data: {
        parent: { id: user.id, phone: parentProfile.phone },
        school: { id: user.school?.id, name: user.school?.name },
        children
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Parent dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
