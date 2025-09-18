import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'performance';
    const period = searchParams.get('period') || 'current_term';

    // Verify user is a director
    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const directorStage = director.teacherProfile.subjects[0];

    // Generate report based on type
    let reportData = {};

    switch (reportType) {
      case 'performance':
        reportData = await generatePerformanceReport(director.schoolId, directorStage);
        break;
      case 'teachers':
        reportData = await generateTeacherReport(director.schoolId, directorStage);
        break;
      case 'students':
        reportData = await generateStudentReport(director.schoolId, directorStage);
        break;
      default:
        reportData = await generatePerformanceReport(director.schoolId, directorStage);
    }

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        period,
        generatedAt: new Date(),
        generatedBy: `${director.firstName} ${director.lastName}`,
        stage: directorStage,
        ...reportData
      }
    });

  } catch (error) {
    console.error('Director reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions for report generation
async function generatePerformanceReport(schoolId, stage) {
  // Use your Result model if available
  let subjectPerformance = [];
  let totalStudents = 0;
  let averageGrade = null;
  let topPerformers = [];
  let needsAttention = [];

  if (prisma.result) {
    const results = await prisma.result.findMany({
      where: {
        schoolId,
        className: { startsWith: stage }
      }
    });
    totalStudents = results.length;
    if (results.length > 0) {
      averageGrade = results.reduce((sum, r) => sum + (r.average || 0), 0) / results.length;
      // Example subject performance aggregation
      const subjectMap = {};
      results.forEach(r => {
        if (!subjectMap[r.subject]) subjectMap[r.subject] = [];
        subjectMap[r.subject].push(r.average);
      });
      subjectPerformance = Object.entries(subjectMap).map(([subject, grades]) => ({
        subject,
        average: grades.reduce((a, b) => a + b, 0) / grades.length,
        passRate: (grades.filter(g => g >= 50).length / grades.length) * 100
      }));
      // Top performers
      topPerformers = results
        .filter(r => r.average >= 80)
        .map(r => ({ studentId: r.studentId, average: r.average, subject: r.subject }));
      // Needs attention
      needsAttention = results
        .filter(r => r.average < 50)
        .map(r => ({ studentId: r.studentId, average: r.average, subject: r.subject }));
    }
  }

  return {
    totalStudents,
    averageGrade,
    subjectPerformance,
    topPerformers,
    needsAttention
  };
}

async function generateTeacherReport(schoolId, stage) {
  const teachers = await prisma.user.findMany({
    where: {
      schoolId,
      role: 'teacher',
      isActive: true,
      teacherProfile: {
        subjects: { hasSome: [stage] }
      }
    },
    include: { teacherProfile: true }
  });

  return {
    totalTeachers: teachers.length,
    teacherMetrics: teachers.map(teacher => ({
      name: `${teacher.firstName} ${teacher.lastName}`,
      subjects: teacher.teacherProfile?.subjects || [],
      gradingEfficiency: null, // Fill with real data if available
      attendanceRate: null // Fill with real data if available
    }))
  };
}

async function generateStudentReport(schoolId, stage) {
  const students = await prisma.user.findMany({
    where: {
      schoolId,
      role: 'student',
      isActive: true,
      studentProfile: {
        className: { startsWith: stage }
      }
    },
    include: { studentProfile: true }
  });

  return {
    totalStudents: students.length,
    classDistribution: students.reduce((acc, student) => {
      const className = student.studentProfile?.className || 'Unknown';
      acc[className] = (acc[className] || 0) + 1;
      return acc;
    }, {}),
    recentEnrollments: students
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(student => ({
        name: `${student.firstName} ${student.lastName}`,
        class: student.studentProfile?.className,
        admissionDate: student.studentProfile?.admissionDate
      }))
  };
}
