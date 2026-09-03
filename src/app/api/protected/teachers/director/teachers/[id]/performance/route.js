// app/api/protected/teachers/director/teachers/[id]/performance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const user = await requireAuth(['TEACHER']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const teacherId = params.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'term';

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'term':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 3));
    }

    // Get teacher's timetable load
    const timetableSlots = await prisma.timetable.findMany({
      where: {
        teacherId,
        schoolId: user.schoolId,
        createdAt: { gte: startDate }
      },
      include: {
        school: true
      }
    });

    // Get assignments created
    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId,
        schoolId: user.schoolId,
        createdAt: { gte: startDate }
      },
      include: {
        submissions: true
      }
    });

    // Get grades given
    const grades = await prisma.grade.findMany({
      where: {
        teacherId,
        schoolId: user.schoolId,
        createdAt: { gte: startDate }
      }
    });

    // Calculate metrics
    const totalSlots = timetableSlots.length;
    const uniqueClasses = [...new Set(timetableSlots.map(t => t.className))].length;
    const uniqueSubjects = [...new Set(timetableSlots.map(t => t.subject))].length;

    const totalAssignments = assignments.length;
    const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
    const gradedSubmissions = assignments.reduce((sum, a) => 
      sum + a.submissions.filter(s => s.status === 'graded').length, 0
    );
    const gradingRate = totalSubmissions > 0 
      ? Math.round((gradedSubmissions / totalSubmissions) * 100) 
      : 0;

    const totalGrades = grades.length;
    const averageGrade = totalGrades > 0
      ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / totalGrades)
      : 0;

    // Teaching load analysis
    const periodsPerWeek = totalSlots;
    const loadStatus = periodsPerWeek > 25 ? 'overloaded' : periodsPerWeek > 20 ? 'high' : 'normal';

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          timetableSlots: totalSlots,
          classesTeaching: uniqueClasses,
          subjectsTeaching: uniqueSubjects,
          assignmentsCreated: totalAssignments,
          gradesGiven: totalGrades,
          gradingRate,
          averageGrade,
          periodsPerWeek,
          loadStatus
        },
        details: {
          assignments: assignments.map(a => ({
            id: a.id,
            title: a.title,
            dueDate: a.dueDate,
            submissions: a.submissions.length,
            graded: a.submissions.filter(s => s.status === 'graded').length
          })),
          timetable: timetableSlots.map(t => ({
            className: t.className,
            subject: t.subject,
            dayOfWeek: t.dayOfWeek,
            period: t.period,
            startTime: t.startTime,
            endTime: t.endTime
          }))
        },
        recommendations: {
          workloadStatus: loadStatus,
          needsSupport: periodsPerWeek > 25,
          gradingPerformance: gradingRate >= 80 ? 'excellent' : gradingRate >= 60 ? 'good' : 'needs improvement'
        }
      }
    });
  } catch (error) {
    console.error('Performance report error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate performance report' },
      { status: 500 }
    );
  }
}