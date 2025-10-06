// app/api/protected/teachers/director/reports/teacher/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'term';
    const teacherId = searchParams.get('teacherId');

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

    if (teacherId) {
      // Single teacher detailed report
      return await getSingleTeacherReport(user, teacherId, startDate);
    } else {
      // All teachers overview
      return await getAllTeachersReport(user, startDate);
    }
  } catch (error) {
    console.error('Teacher report error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate teacher report' },
      { status: 500 }
    );
  }
}

async function getSingleTeacherReport(user, teacherId, startDate) {
  // Verify teacher exists in same school
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      schoolId: user.schoolId,
      role: 'teacher',
      isActive: true
    },
    include: {
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }
    }
  });

  if (!teacher) {
    return NextResponse.json(
      { success: false, error: 'Teacher not found' },
      { status: 404 }
    );
  }

  // Get timetable load
  const timetableSlots = await prisma.timetable.findMany({
    where: {
      teacherId,
      schoolId: user.schoolId,
      createdAt: { gte: startDate }
    }
  });

  const uniqueClasses = [...new Set(timetableSlots.map(t => t.className))];
  const periodsPerWeek = timetableSlots.length;

  // Get assignments
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

  const totalAssignments = assignments.length;
  const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
  const gradedSubmissions = assignments.reduce(
    (sum, a) => sum + a.submissions.filter(s => s.status === 'graded').length,
    0
  );
  const gradingRate = totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0;

  // Get grades given
  const grades = await prisma.grade.findMany({
    where: {
      teacherId,
      schoolId: user.schoolId,
      createdAt: { gte: startDate }
    }
  });

  const totalGrades = grades.length;
  const averageGrade = totalGrades > 0
    ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / totalGrades)
    : 0;

  // Calculate student pass rate
  const passedGrades = grades.filter(g => Number(g.percentage) >= 50).length;
  const passRate = totalGrades > 0 ? Math.round((passedGrades / totalGrades) * 100) : 0;

  // Get attendance marking
  const attendanceMarked = await prisma.attendance.count({
    where: {
      markedBy: teacherId,
      schoolId: user.schoolId,
      markedAt: { gte: startDate }
    }
  });

  // Workload assessment
  const loadStatus = periodsPerWeek > 25 ? 'overloaded' : periodsPerWeek > 20 ? 'high' : periodsPerWeek > 15 ? 'moderate' : 'light';

  // Performance rating
  let performanceScore = 0;
  if (gradingRate >= 80) performanceScore += 30;
  else if (gradingRate >= 60) performanceScore += 20;
  else performanceScore += 10;

  if (passRate >= 70) performanceScore += 30;
  else if (passRate >= 50) performanceScore += 20;
  else performanceScore += 10;

  if (totalAssignments >= 10) performanceScore += 20;
  else if (totalAssignments >= 5) performanceScore += 15;
  else performanceScore += 5;

  if (attendanceMarked > 0) performanceScore += 20;

  const performanceRating = performanceScore >= 80 ? 'excellent' : 
                           performanceScore >= 60 ? 'good' : 
                           performanceScore >= 40 ? 'satisfactory' : 'needs_improvement';

  return NextResponse.json({
    success: true,
    data: {
      teacher: {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        department: teacher.teacherProfile?.department,
        experienceYears: teacher.teacherProfile?.experienceYears || 0,
        subjects: teacher.teacherProfile?.teacherSubjects?.map(ts => ({
          name: ts.subject.name,
          code: ts.subject.code,
          classes: ts.classes
        })) || []
      },
      metrics: {
        timetableLoad: {
          periodsPerWeek,
          uniqueClasses: uniqueClasses.length,
          loadStatus,
          classes: uniqueClasses
        },
        assignments: {
          total: totalAssignments,
          submissions: totalSubmissions,
          graded: gradedSubmissions,
          gradingRate,
          pendingGrading: totalSubmissions - gradedSubmissions
        },
        grading: {
          totalGrades,
          averageGrade,
          passRate,
          passedStudents: passedGrades,
          failedStudents: totalGrades - passedGrades
        },
        attendance: {
          recordsMarked: attendanceMarked
        }
      },
      performance: {
        score: performanceScore,
        rating: performanceRating,
        strengths: [],
        improvements: []
      },
      recommendations: []
    }
  });
}

async function getAllTeachersReport(user, startDate) {
  const teachers = await prisma.user.findMany({
    where: {
      schoolId: user.schoolId,
      role: 'teacher',
      isActive: true
    },
    include: {
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }
    }
  });

  const teacherReports = await Promise.all(
    teachers.map(async (teacher) => {
      // Timetable load
      const timetableSlots = await prisma.timetable.count({
        where: {
          teacherId: teacher.id,
          schoolId: user.schoolId,
          createdAt: { gte: startDate }
        }
      });

      // Assignments
      const assignments = await prisma.assignment.findMany({
        where: {
          teacherId: teacher.id,
          schoolId: user.schoolId,
          createdAt: { gte: startDate }
        },
        include: {
          submissions: true
        }
      });

      const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
      const gradedSubmissions = assignments.reduce(
        (sum, a) => sum + a.submissions.filter(s => s.status === 'graded').length,
        0
      );
      const gradingRate = totalSubmissions > 0 ? Math.round((gradedSubmissions / totalSubmissions) * 100) : 0;

      // Grades
      const grades = await prisma.grade.findMany({
        where: {
          teacherId: teacher.id,
          schoolId: user.schoolId,
          createdAt: { gte: startDate }
        }
      });

      const passRate = grades.length > 0
        ? Math.round((grades.filter(g => Number(g.percentage) >= 50).length / grades.length) * 100)
        : 0;

      return {
        id: teacher.id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        department: teacher.teacherProfile?.department,
        subjects: teacher.teacherProfile?.teacherSubjects?.length || 0,
        timetableSlots,
        assignmentsCreated: assignments.length,
        gradingRate,
        passRate,
        gradesGiven: grades.length,
        lastLogin: teacher.lastLogin
      };
    })
  );

  // Calculate summary statistics
  const summary = {
    totalTeachers: teachers.length,
    avgGradingRate: Math.round(
      teacherReports.reduce((sum, t) => sum + t.gradingRate, 0) / teachers.length
    ),
    avgPassRate: Math.round(
      teacherReports.reduce((sum, t) => sum + t.passRate, 0) / teachers.length
    ),
    totalAssignments: teacherReports.reduce((sum, t) => sum + t.assignmentsCreated, 0),
    totalGrades: teacherReports.reduce((sum, t) => sum + t.gradesGiven, 0),
    activeTeachers: teacherReports.filter(t => {
      if (!t.lastLogin) return false;
      const daysSince = Math.floor((new Date() - new Date(t.lastLogin)) / (1000 * 60 * 60 * 24));
      return daysSince <= 7;
    }).length
  };

  // Top performers
  const topPerformers = [...teacherReports]
    .sort((a, b) => (b.gradingRate + b.passRate) - (a.gradingRate + a.passRate))
    .slice(0, 5);

  // Need attention
  const needsAttention = teacherReports.filter(
    t => t.gradingRate < 50 || t.passRate < 50 || t.assignmentsCreated === 0
  );

  return NextResponse.json({
    success: true,
    data: {
      summary,
      teachers: teacherReports,
      topPerformers,
      needsAttention,
      period: startDate.toISOString()
    }
  });
}