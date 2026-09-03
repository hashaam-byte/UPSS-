import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// POST - Assign a teacher as the coordinator for a class
export async function POST(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });

    if (!director || director.role !== 'TEACHER' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { teacherId, classId } = body;

    if (!teacherId || !classId) {
      return NextResponse.json(
        { error: 'teacherId and classId are required' },
        { status: 400 }
      );
    }

    // Verify the target teacher belongs to this school and has a teacher profile
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: director.schoolId,
        role: 'TEACHER',
        isActive: true
      },
      include: { teacherProfile: true }
    });

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Verify the class belongs to this school
    const classRecord = await prisma.class.findFirst({
      where: { id: classId, schoolId: director.schoolId }
    });

    if (!classRecord) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Assign (idempotent — re-assigning the same pair just returns the existing link)
    const assignment = await prisma.teacherClassCoordinator.upsert({
      where: {
        teacherId_classId: {
          teacherId: teacher.teacherProfile.id,
          classId: classRecord.id
        }
      },
      update: {},
      create: {
        teacherId: teacher.teacherProfile.id,
        classId: classRecord.id
      }
    });

    // Keep the denormalized coordinatorClass field in sync for coordinator-department teachers,
    // matching how it's read elsewhere in the app
    if (teacher.teacherProfile.department === 'coordinator') {
      await prisma.teacherProfile.update({
        where: { id: teacher.teacherProfile.id },
        data: { coordinatorClass: classRecord.name }
      });
    }

    return NextResponse.json({
      success: true,
      message: `${teacher.firstName} ${teacher.lastName} assigned to ${classRecord.name}`,
      data: {
        assignmentId: assignment.id,
        teacherId: teacher.id,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        classId: classRecord.id,
        className: classRecord.name
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Assign class error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a teacher's class coordinator assignment
export async function DELETE(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });

    if (!director || director.role !== 'TEACHER' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');

    if (!teacherId || !classId) {
      return NextResponse.json(
        { error: 'teacherId and classId query params are required' },
        { status: 400 }
      );
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId }
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    await prisma.teacherClassCoordinator.deleteMany({
      where: { teacherId: teacherProfile.id, classId }
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment removed'
    });

  } catch (error) {
    console.error('Remove class assignment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
