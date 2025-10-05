// /app/api/protected/students/grades/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);
    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const subject = searchParams.get('subject');
    const recent = searchParams.get('recent');
    const limit = searchParams.get('limit');

    // Build where clause
    const whereClause = {
      studentId: user.id,
      schoolId: user.schoolId
    };

    if (term && term !== 'current') {
      whereClause.termName = term;
    }

    if (subject && subject !== 'all') {
      whereClause.subjectId = subject;
    }

    // Fetch grades
    const grades = await prisma.grade.findMany({
      where: whereClause,
      include: {
        subject: {
          select: {
            name: true
          }
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        assessmentDate: 'desc'
      },
      take: limit ? parseInt(limit) : undefined
    });

    // Transform grades data
    const transformedGrades = grades.map(grade => ({
      id: grade.id,
      subjectName: grade.subject.name,
      subjectId: grade.subjectId,
      assessmentName: grade.assessmentName,
      assessmentType: grade.assessmentType,
      score: grade.score,
      maxScore: grade.maxScore,
      percentage: Number(grade.percentage),
      grade: grade.grade,
      comments: grade.comments,
      assessmentDate: grade.assessmentDate,
      termName: grade.termName,
      academicYear: grade.academicYear,
      teacherName: `${grade.teacher.firstName} ${grade.teacher.lastName}`,
      position: grade.position,
      classAverage: grade.classAverage ? Number(grade.classAverage) : null
    }));

    // Calculate statistics by subject
    const subjectStats = [];
    const subjectGroups = {};

    transformedGrades.forEach(grade => {
      if (!subjectGroups[grade.subjectId]) {
        subjectGroups[grade.subjectId] = {
          subjectName: grade.subjectName,
          grades: []
        };
      }
      subjectGroups[grade.subjectId].grades.push(grade);
    });

    for (const [subjectId, group] of Object.entries(subjectGroups)) {
      const gradesList = group.grades;
      const averagePercentage = gradesList.reduce((sum, g) => sum + g.percentage, 0) / gradesList.length;
      
      // Determine trend
      let trend = 'stable';
      if (gradesList.length >= 2) {
        const recent = gradesList[0].percentage;
        const previous = gradesList[1].percentage;
        if (recent > previous + 5) trend = 'improving';
        else if (recent < previous - 5) trend = 'declining';
      }

      subjectStats.push({
        subjectName: group.subjectName,
        subjectId: subjectId,
        totalAssessments: gradesList.length,
        averagePercentage: Math.round(averagePercentage),
        averageGrade: getGradeLetter(averagePercentage),
        trend,
        latestScore: gradesList[0].percentage,
        latestDate: gradesList[0].assessmentDate
      });
    }

    // Calculate overall stats
    const overallAverage = transformedGrades.length > 0
      ? Math.round(transformedGrades.reduce((sum, g) => sum + g.percentage, 0) / transformedGrades.length)
      : 0;

    const currentGPA = calculateGPA(overallAverage);

    // Get class rank (you'll need to implement this based on your ranking logic)
    const classRank = await getClassRank(user.id, user.schoolId);

    const overallStats = {
      overallAverage,
      currentGPA,
      classRank: classRank.rank,
      totalClassStudents: classRank.total,
      totalAssessments: transformedGrades.length
    };

    return NextResponse.json({
      success: true,
      data: {
        grades: transformedGrades,
        subjectStats,
        overallStats
      }
    });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}

// Helper functions
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
    // Get student's class
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      select: { className: true }
    });

    if (!studentProfile || !studentProfile.className) {
      return { rank: null, total: 0 };
    }

    // Get all students in the same class with their averages
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

    // Calculate average for each student
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

    // Find rank
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