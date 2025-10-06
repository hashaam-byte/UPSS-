// app/api/protected/teacher/subject/dashboard/route.js
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

    // Get today's day of week
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const dayOfWeek = daysOfWeek[today.getDay()];
    const currentTime = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;

    // Fetch today's timetable
    const todaySchedule = await prisma.timetable.findMany({
      where: {
        schoolId: user.schoolId,
        teacherId: user.id,
        dayOfWeek: dayOfWeek
      },
      orderBy: {
        period: 'asc'
      }
    });

    // Enrich schedule with status
    const enrichedSchedule = todaySchedule.map(lesson => {
      let status = 'upcoming';
      
      if (currentTime >= lesson.startTime && currentTime <= lesson.endTime) {
        status = 'ongoing';
      } else if (currentTime > lesson.endTime) {
        status = 'completed';
      }

      return {
        id: lesson.id,
        period: lesson.period,
        subject: lesson.subject,
        className: lesson.className,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        status
      };
    });

    // Get teacher's subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: user.profile.id },
      include: {
        subject: {
          include: {
            assignments: {
              where: {
                teacherId: user.id,
                status: 'active'
              }
            }
          }
        }
      }
    });

    // Get all classes this teacher teaches
    const allClasses = [...new Set(teacherSubjects.flatMap(ts => ts.classes))];

    // Get total students
    const totalStudents = await prisma.user.count({
      where: {
        role: 'student',
        schoolId: user.schoolId,
        studentProfile: {
          className: { in: allClasses }
        }
      }
    });

    // Get pending grading count
    const pendingGrading = await prisma.assignmentSubmission.count({
      where: {
        assignment: {
          teacherId: user.id
        },
        status: 'submitted'
      }
    });

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      where: {
        teacherId: user.id
      },
      include: {
        subject: true,
        submissions: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get average performance
    const grades = await prisma.grade.findMany({
      where: {
        teacherId: user.id,
        schoolId: user.schoolId
      }
    });

    const averagePerformance = grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length)
      : 0;

    // Upcoming deadlines
    const upcomingDeadlines = await prisma.assignment.findMany({
      where: {
        teacherId: user.id,
        status: 'active',
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        todaySchedule: enrichedSchedule,
        dayOfWeek,
        currentTime,
        summary: {
          totalStudents,
          totalSubjects: teacherSubjects.length,
          activeAssignments: recentAssignments.filter(a => a.status === 'active').length,
          pendingGrading,
          averagePerformance
        },
        teacherSubjects: teacherSubjects.map(ts => ({
          id: ts.id,
          subject: ts.subject,
          classes: ts.classes,
          studentCount: 0 // Will be calculated
        })),
        recentAssignments: recentAssignments.map(a => ({
          id: a.id,
          title: a.title,
          subject: a.subject.name,
          dueDate: a.dueDate,
          status: a.status,
          submissionCount: a.submissions.length,
          totalStudents: 0 // Will be calculated
        })),
        upcomingDeadlines
      }
    });

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}