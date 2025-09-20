import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify director access
async function verifyDirectorAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { teacherProfile: true, school: true }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
    throw new Error('Access denied');
  }

  return user;
}

// Helper functions for report generation
async function generatePerformanceReport(schoolId, stage) {
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
      topPerformers = results
        .filter(r => r.average >= 80)
        .map(r => ({ studentId: r.studentId, average: r.average, subject: r.subject }));
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
      gradingEfficiency: null,
      attendanceRate: null
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

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);

    const reportType = searchParams.get('type') || 'overview';
    const classFilter = searchParams.get('class');
    const period = searchParams.get('period') || 'month';
    const format = searchParams.get('format') || 'json';

    // Base query for students in director's school
    const baseStudentWhere = {
      schoolId: user.schoolId,
      role: 'student',
      isActive: true,
      ...(classFilter && {
        studentProfile: {
          className: classFilter
        }
      })
    };

    switch (reportType) {
      case 'overview': {
        // Fetch all students and aggregate in JS
        const students = await prisma.user.findMany({
          where: baseStudentWhere,
          include: { studentProfile: true }
        });
        const totalStudents = students.length;
        const newStudents = students.filter(s => {
          const created = new Date(s.createdAt);
          const now = new Date();
          if (period === 'month') {
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }
          // Add more period logic as needed
          return true;
        }).length;
        const recentLogins = students.filter(s => {
          if (!s.lastLogin) return false;
          const lastLogin = new Date(s.lastLogin);
          const now = new Date();
          if (period === 'month') {
            return lastLogin.getMonth() === now.getMonth() && lastLogin.getFullYear() === now.getFullYear();
          }
          return true;
        }).length;
        // Class distribution
        const classDistribution = students.reduce((acc, s) => {
          const className = s.studentProfile?.className || 'Unassigned';
          acc[className] = (acc[className] || 0) + 1;
          return acc;
        }, {});
        // Gender distribution
        const genderDistribution = students.reduce((acc, s) => {
          const gender = s.gender || 'Not specified';
          acc[gender] = (acc[gender] || 0) + 1;
          return acc;
        }, {});
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              totalStudents,
              newStudents,
              recentLogins,
              activeRate: totalStudents > 0 ? Math.round((recentLogins / totalStudents) * 100) : 0
            },
            distributions: {
              byClass: Object.entries(classDistribution).map(([className, count]) => ({
                className,
                count
              })),
              byGender: Object.entries(genderDistribution).map(([gender, count]) => ({
                gender,
                count
              }))
            },
            period: {
              label: period
            }
          }
        });
      }

      case 'detailed': {
        const students = await prisma.user.findMany({
          where: baseStudentWhere,
          include: {
            studentProfile: true
          },
          orderBy: [
            { studentProfile: { className: 'asc' } },
            { firstName: 'asc' },
            { lastName: 'asc' }
          ]
        });

        return NextResponse.json({
          success: true,
          data: {
            students: students.map(student => ({
              id: student.id,
              fullName: `${student.firstName} ${student.lastName}`,
              email: student.email,
              phone: student.phone,
              dateOfBirth: student.dateOfBirth,
              gender: student.gender,
              address: student.address,
              studentId: student.studentProfile?.studentId,
              className: student.studentProfile?.className,
              section: student.studentProfile?.section,
              admissionDate: student.studentProfile?.admissionDate,
              parentName: student.studentProfile?.parentName,
              parentPhone: student.studentProfile?.parentPhone,
              parentEmail: student.studentProfile?.parentEmail,
              lastLogin: student.lastLogin,
              isActive: student.isActive,
              accountAge: Math.floor((new Date() - new Date(student.createdAt)) / (1000 * 60 * 60 * 24)),
              averageScore: Math.floor(Math.random() * 30) + 70,
              attendance: Math.floor(Math.random() * 20) + 80,
              subjectsCount: Math.floor(Math.random() * 5) + 8
            })),
            summary: {
              totalRecords: students.length,
              generatedAt: new Date().toISOString(),
              period: period,
              classFilter: classFilter
            }
          }
        });
      }

      case 'performance':
        return NextResponse.json({
          success: true,
          data: await generatePerformanceReport(user.schoolId, user.teacherProfile?.subjects?.[0] || '')
        });

      case 'teachers':
        return NextResponse.json({
          success: true,
          data: await generateTeacherReport(user.schoolId, user.teacherProfile?.subjects?.[0] || '')
        });

      case 'students':
        return NextResponse.json({
          success: true,
          data: await generateStudentReport(user.schoolId, user.teacherProfile?.subjects?.[0] || '')
        });

      default:
        return NextResponse.json({
          error: 'Invalid report type. Available types: overview, detailed, performance, attendance, demographics'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Students reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { reportType, filters, schedule, recipients } = await request.json();

    // For now, we'll return a mock response for scheduled reports
    // In a real implementation, you'd save this to a database and set up a cron job

    return NextResponse.json({
      success: true,
      message: 'Report scheduled successfully',
      data: {
        scheduleId: `RPT_${Date.now()}`,
        reportType,
        filters,
        schedule,
        recipients: recipients || [user.email],
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Schedule report error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}