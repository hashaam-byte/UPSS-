import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth(['subject_teacher']);
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: { include: { subject: true } } }
    });
    const assignedSubjects = teacherProfile.teacherSubjects.map(ts => ({
      subject: ts.subject.name,
      classes: ts.classes
    }));

    return NextResponse.json({ dashboard: { assignedSubjects } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
