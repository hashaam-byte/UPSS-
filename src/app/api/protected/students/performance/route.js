// /app/api/protected/students/performance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current_term';

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    // Build date filter based on period
    let dateFilter = {};
    if (period === 'current_term') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      dateFilter = { gte: threeMonthsAgo };
    } else if (period === 'last_term') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      dateFilter = { gte: sixMonthsAgo, lte: threeMonthsAgo };
    }

    // Fetch grades
    const grades = await prisma.grade.findMany({
      where: {
        studentId: user.id,
        assessmentDate: dateFilter
      },
      include: {
        subject: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        assessmentDate: 'desc'
      }
    });

    // Calculate overall statistics
    const overallAverage = grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length)
      : 0;

    const currentGPA = calculateGPA(overallAverage);

    // Get attendance
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId: user.id,
        date: dateFilter
      }
    });

    const attendanceRate = attendance.length > 0
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
      : 0;

    // Get assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        schoolId: user.schoolId,
        classes: {
          has: studentProfile?.className
        },
        createdAt: dateFilter
      }
    });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId: user.id,
        assignment: {
          createdAt: dateFilter
        }
      }
    });

    const assignmentCompletion = assignments.length > 0
      ? Math.round((submissions.length / assignments.length) * 100)
      : 0;

    // Get class rank
    const classRank = await getClassRank(user.id, user.schoolId);

    const overallStats = {
      overallAverage,
      currentGPA,
      classRank: classRank.rank,
      totalClassStudents: classRank.total,
      totalAssessments: grades.length,
      attendanceRate,
      assignmentCompletion
    };

    // Calculate subject statistics
    const subjectGroups = {};
    grades.forEach(grade => {
      const subjectName = grade.subject.name;
      if (!subjectGroups[subjectName]) {
        subjectGroups[subjectName] = [];
      }
      subjectGroups[subjectName].push(grade);
    });

    const subjectStats = Object.entries(subjectGroups).map(([subjectName, gradesList]) => {
      const averagePercentage = gradesList.reduce((sum, g) => sum + Number(g.percentage), 0) / gradesList.length;
      
      let trend = 'stable';
      if (gradesList.length >= 2) {
        const recent = Number(gradesList[0].percentage);
        const previous = Number(gradesList[1].percentage);
        if (recent > previous + 5) trend = 'improving';
        else if (recent < previous - 5) trend = 'declining';
      }

      return {
        subjectName,
        totalAssessments: gradesList.length,
        averagePercentage: Math.round(averagePercentage),
        averageGrade: getGradeLetter(averagePercentage),
        trend,
        latestScore: Number(gradesList[0].percentage),
        latestDate: gradesList[0].assessmentDate
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        overallStats,
        subjectStats,
        grades: grades.map(g => ({
          id: g.id,
          subjectName: g.subject.name,
          assessmentName: g.assessmentName,
          assessmentType: g.assessmentType,
          score: g.score,
          maxScore: g.maxScore,
          percentage: Number(g.percentage),
          grade: g.grade,
          assessmentDate: g.assessmentDate
        }))
      }
    });
  } catch (error) {
    console.error('Get performance error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch performance data' },
      { status: 500 }
    );
  }
}

function getGradeLetter(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

function calculateGPA(percentage) {
  if (percentage >= 90) return 4.0;
  if (percentage >= 80) return 3.0;
  if (percentage >= 70) return 2.0;
  if (percentage >= 60) return 1.0;
  return 0.0;
}

async function getClassRank(studentId, schoolId) {
  try {
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: { className: true }
    });

    if (!studentProfile || !studentProfile.className) {
      return { rank: null, total: 0 };
    }

    const classStudents = await prisma.user.findMany({
      where: {
        schoolId,
        role: 'student',
        studentProfile: {
          className: studentProfile.className
        }
      },
      include: {
        receivedGrades: {
          select: {
            percentage: true
          }
        }
      }
    });

    const studentAverages = classStudents.map(student => {
      const grades = student.receivedGrades;
      const average = grades.length > 0
        ? grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length
        : 0;
      
      return {
        studentId: student.id,
        average
      };
    }).sort((a, b) => b.average - a.average);

    const rank = studentAverages.findIndex(s => s.studentId === studentId) + 1;

    return {
      rank: rank > 0 ? rank : null,
      total: studentAverages.length
    };
  } catch (error) {
    console.error('Get class rank error:', error);
    return { rank: null, total: 0 };
  }
}