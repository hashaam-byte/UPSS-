import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth(['subject_teacher']);
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    const students = await prisma.studentProfile.findMany({
      where: { className: { in: assignedClasses } }
    });

    return NextResponse.json({ students });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
