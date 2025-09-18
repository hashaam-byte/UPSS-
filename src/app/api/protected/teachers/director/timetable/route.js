import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

const PERIODS = {
  "1": { start: "08:00", end: "09:05" },
  "2": { start: "09:05", end: "10:10" },
  "3": { start: "10:10", end: "11:15" }, 
  "BREAK": { start: "11:35", end: "12:00" }, // 25 minute break
  "4": { start: "12:00", end: "13:05" },
  "5": { start: "13:05", end: "14:15" }, // Last period
};

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // Ensure user is a director
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id }
    });

    if (!teacherProfile || teacherProfile.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const className = searchParams.get('class');
    const dayOfWeek = searchParams.get('day');

    // Get timetable entries
    const timetable = await prisma.timetable.findMany({
      where: {
        schoolId: user.schoolId,
        ...(className && { className }),
        ...(dayOfWeek && { dayOfWeek })
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            teacherProfile: {
              select: {
                department: true,
                subjects: true
              }
            }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: {
        timetable,
        periods: PERIODS
      }
    });

  } catch (error) {
    console.error('Timetable GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // Ensure user is a director
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id }
    });

    if (!teacherProfile || teacherProfile.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { className, dayOfWeek, period, subject, teacherId } = await request.json();

    // Validate input
    if (!className || !dayOfWeek || !period || !subject || !teacherId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check for existing class timetable entry
    const existingClass = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        className,
        dayOfWeek,
        period
      }
    });

    if (existingClass) {
      return NextResponse.json(
        { error: 'Time slot already occupied for this class' },
        { status: 409 }
      );
    }

    // Check for teacher availability (no class clash)
    const teacherClash = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        teacherId,
        dayOfWeek,
        period
      }
    });

    if (teacherClash) {
      return NextResponse.json(
        { error: 'Teacher already has a class at this time' },
        { status: 409 }
      );
    }

    // Check for breathing space (no back-to-back periods)
    const adjacentPeriods = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        teacherId,
        dayOfWeek,
        period: {
          in: [period - 1, period + 1]
        }
      }
    });

    if (adjacentPeriods) {
      return NextResponse.json(
        { error: 'Teachers must have a free period between classes' },
        { status: 409 }
      );
    }

    // Create timetable entry
    const periodTimes = PERIODS[period];
    const timetable = await prisma.timetable.create({
      data: {
        schoolId: user.schoolId,
        className,
        dayOfWeek,
        period,
        subject,
        teacherId,
        startTime: periodTimes.start,
        endTime: periodTimes.end,
        createdById: user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: timetable
    });

  } catch (error) {
    console.error('Timetable POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
