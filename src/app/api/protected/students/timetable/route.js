// /app/api/protected/students/timetable/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);
    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week');
    const date = searchParams.get('date');

    // Get student's class
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true, section: true }
    });

    if (!studentProfile || !studentProfile.className) {
      return NextResponse.json({
        success: true,
        data: {
          studentInfo: {
            className: 'N/A',
            section: 'N/A'
          },
          schedule: [],
          classes: []
        }
      });
    }

    // Build the timetable where clause
    const whereClause = {
      schoolId: user.schoolId,
      className: studentProfile.className
    };

    // Fetch timetable for student's class
    const timetable = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' }
      ]
    });

    // Days of the week in order
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Transform timetable data into structured format
    const schedule = timetable.map(entry => ({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      period: entry.period,
      subject: entry.subject,
      teacher: `${entry.teacher.firstName} ${entry.teacher.lastName}`,
      teacherId: entry.teacher.id,
      startTime: entry.startTime,
      endTime: entry.endTime,
      timeSlot: `${entry.startTime}-${entry.endTime}`
    })).sort((a, b) => {
      // Sort by day of week first, then by period
      const dayComparison = daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek);
      if (dayComparison !== 0) return dayComparison;
      return a.period - b.period;
    });

    // Get today's classes if date parameter is 'today'
    let todayClasses = [];
    if (date === 'today') {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      todayClasses = schedule
        .filter(entry => entry.dayOfWeek === today)
        .map(entry => ({
          subject: entry.subject,
          teacher: entry.teacher,
          time: entry.startTime,
          timeSlot: entry.timeSlot,
          room: `Room ${Math.floor(100 + Math.random() * 200)}` // You can add room field to schema
        }));
    }

    return NextResponse.json({
      success: true,
      data: {
        studentInfo: {
          className: studentProfile.className,
          section: studentProfile.section
        },
        schedule,
        classes: todayClasses,
        weekStart: getWeekStart(week),
        weekEnd: getWeekEnd(week)
      }
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch timetable' },
      { status: 500 }
    );
  }
}

// Helper function to get week start date
function getWeekStart(weekParam) {
  const date = weekParam ? new Date(weekParam) : new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

// Helper function to get week end date
function getWeekEnd(weekParam) {
  const start = getWeekStart(weekParam);
  const end = new Date(start);
  end.setDate(end.getDate() + 4); // Friday
  return end;
}