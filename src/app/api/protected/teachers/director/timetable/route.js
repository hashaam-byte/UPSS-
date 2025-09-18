import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Only director can view
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });
    if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all timetables for director's stage
    const timetables = await prisma.timetable.findMany({
      where: {
        schoolId: user.schoolId,
        className: { in: user.teacherProfile.subjects }
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }]
    });

    return NextResponse.json({
      success: true,
      data: timetables
    });
  } catch (error) {
    console.error('Director timetable GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Add or update a timetable entry, ensuring no teacher clashes and breathing space
export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { className, dayOfWeek, period, subject, teacherId, startTime, endTime } = await request.json();

    // Only director can create/update
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });
    if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check for teacher clash (teacher cannot have two classes at the same period on the same day)
    const clash = await prisma.timetable.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        period
      }
    });
    if (clash) {
      return NextResponse.json({ error: 'Teacher already assigned to another class at this period.' }, { status: 409 });
    }

    // Check for breathing space (no back-to-back periods for same teacher)
    const prevPeriod = await prisma.timetable.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        period: period - 1
      }
    });
    const nextPeriod = await prisma.timetable.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        period: period + 1
      }
    });
    if (prevPeriod || nextPeriod) {
      return NextResponse.json({ error: 'Teacher must have a free period before and after this period.' }, { status: 409 });
    }

    // Create timetable entry
    const timetable = await prisma.timetable.create({
      data: {
        schoolId: user.schoolId,
        className,
        dayOfWeek,
        period,
        subject,
        teacherId,
        startTime,
        endTime,
        createdById: user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: timetable
    });
  } catch (error) {
    console.error('Director timetable POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
