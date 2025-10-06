// app/api/protected/teacher/subject/today-schedule/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher' || user.department !== 'subject_teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get current day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayOfWeek = daysOfWeek[today.getDay()];

    // Get today's timetable for this teacher
    const schedule = await prisma.timetable.findMany({
      where: {
        schoolId: user.schoolId,
        teacherId: user.id,
        dayOfWeek: dayOfWeek
      },
      orderBy: {
        period: 'asc'
      }
    });

    // Enrich with current status (ongoing, upcoming, completed)
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const enrichedSchedule = schedule.map(lesson => {
      let status = 'upcoming';
      
      if (currentTime >= lesson.startTime && currentTime <= lesson.endTime) {
        status = 'ongoing';
      } else if (currentTime > lesson.endTime) {
        status = 'completed';
      }

      return {
        ...lesson,
        status
      };
    });

    return NextResponse.json({
      success: true,
      schedule: enrichedSchedule,
      dayOfWeek
    });

  } catch (error) {
    console.error('Fetch schedule error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}