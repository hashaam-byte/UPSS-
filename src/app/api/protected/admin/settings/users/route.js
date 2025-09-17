import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth(['admin']);
    const school = await prisma.school.findUnique({
      where: { id: user.school.id },
      select: {
        allowStudentRegistration: true,
        allowTeacherRegistration: true,
        requireEmailVerification: true,
        maxStudents: true,
        maxTeachers: true
      }
    });
    // Map DB fields to UI fields
    const settings = {
      allowStudentRegistration: school.allowStudentRegistration,
      allowTeacherRegistration: school.allowTeacherRegistration,
      requireEmailVerification: school.requireEmailVerification,
      maxStudentsPerClass: school.maxStudents,
      defaultUserRole: 'student'
    };
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['admin']);
    const data = await request.json();
    await prisma.school.update({
      where: { id: user.school.id },
      data: {
        allowStudentRegistration: data.allowStudentRegistration,
        allowTeacherRegistration: data.allowTeacherRegistration,
        requireEmailVerification: data.requireEmailVerification,
        maxStudents: data.maxStudentsPerClass
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user settings' }, { status: 500 });
  }
}
