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

// Helper function to calculate date ranges
function getDateRange(period) {
  const now = new Date();
  const ranges = {
    'today': {
      start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    },
    'week': {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now
    },
    'month': {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1)
    },
    'term': {
      start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
      end: now
    },
    'year': {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1)
    }
  };
  return ranges[period] || ranges.month;
}

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);
    
    const reportType = searchParams.get('type') || 'overview';
    const classFilter = searchParams.get('class');
    const period = searchParams.get('period') || 'month';
    const format = searchParams.get('format') || 'json';

    const dateRange = getDateRange(period);

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
      case 'overview':
        // General overview statistics
        const totalStudents = await prisma.user.count({ where: baseStudentWhere });
        
        const newStudents = await prisma.user.count({
          where: {
            ...baseStudentWhere,
            createdAt: {
              gte: dateRange.start,
              lt: dateRange.end
            }
          }
        });

        const recentLogins = await prisma.user.count({
          where: {
            ...baseStudentWhere,
            lastLogin: {
              gte: dateRange.start,
              lt: dateRange.end
            }
          }
        });

        // Class distribution
        const classDistribution = await prisma.user.groupBy({
          by: ['studentProfile.className'],
          where: baseStudentWhere,
          _count: true
        });

        // Gender distribution
        const genderDistribution = await prisma.user.groupBy({
          by: ['gender'],
          where: baseStudentWhere,
          _count: true
        });

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
              byClass: classDistribution.map(item => ({
                className: item.studentProfile?.className || 'Unassigned',
                count: item._count
              })),
              byGender: genderDistribution.map(item => ({
                gender: item.gender || 'Not specified',
                count: item._count
              }))
            },
            period: {
              label: period,
              start: dateRange.start,
              end: dateRange.end
            }
          }
        });

      case 'detailed':
        // Detailed student list with profiles
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
              // Mock academic data - replace with actual data when available
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

      case 'performance':
        // Academic performance report (mock data for now)
        const performanceData = await prisma.user.findMany({
          where: baseStudentWhere,
          include: {
            studentProfile: true
          }
        });

        const classPerformance = {};
        performanceData.forEach(student => {
          const className = student.studentProfile?.className || 'Unassigned';
          if (!classPerformance[className]) {
            classPerformance[className] = {
              students: 0,
              totalScore: 0,
              highPerformers: 0,
              lowPerformers: 0
            };
          }
          
          const mockScore = Math.floor(Math.random() * 40) + 60;
          classPerformance[className].students++;
          classPerformance[className].totalScore += mockScore;
          
          if (mockScore >= 85) classPerformance[className].highPerformers++;
          if (mockScore < 65) classPerformance[className].lowPerformers++;
        });

        return NextResponse.json({
          success: true,
          data: {
            performance: Object.entries(classPerformance).map(([className, stats]) => ({
              className,
              studentCount: stats.students,
              averageScore: Math.round(stats.totalScore / stats.students),
              highPerformers: stats.highPerformers,
              lowPerformers: stats.lowPerformers,
              performanceRate: Math.round((stats.highPerformers / stats.students) * 100)
            })),
            overall: {
              totalStudents: performanceData.length,
              averageScore: Math.round(
                Object.values(classPerformance).reduce((sum, stats) => sum + stats.totalScore, 0) /
                Object.values(classPerformance).reduce((sum, stats) => sum + stats.students, 0)
              ),
              topPerformers: Object.values(classPerformance).reduce((sum, stats) => sum + stats.highPerformers, 0),
              strugglingStudents: Object.values(classPerformance).reduce((sum, stats) => sum + stats.lowPerformers, 0)
            }
          }
        });

      case 'attendance':
        // Attendance report (mock data)
        const attendanceData = await prisma.user.findMany({
          where: baseStudentWhere,
          include: {
            studentProfile: true
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            attendance: attendanceData.map(student => ({
              id: student.id,
              fullName: `${student.firstName} ${student.lastName}`,
              className: student.studentProfile?.className,
              presentDays: Math.floor(Math.random() * 10) + 15,
              totalDays: 25,
              attendanceRate: Math.floor(Math.random() * 20) + 80,
              lateArrivals: Math.floor(Math.random() * 5),
              lastPresent: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            })),
            summary: {
              averageAttendance: Math.floor(Math.random() * 15) + 85,
              perfectAttendance: Math.floor(Math.random() * 10) + 5,
              poorAttendance: Math.floor(Math.random() * 8) + 2,
              period: period
            }
          }
        });

      case 'demographics':
        // Demographics breakdown
        const demographics = await prisma.user.findMany({
          where: baseStudentWhere,
          include: {
            studentProfile: true
          }
        });

        const ageGroups = {};
        const locations = {};
        
        demographics.forEach(student => {
          // Age grouping
          if (student.dateOfBirth) {
            const age = new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear();
            const ageGroup = `${Math.floor(age / 2) * 2}-${Math.floor(age / 2) * 2 + 1}`;
            ageGroups[ageGroup] = (ageGroups[ageGroup] || 0) + 1;
          }

          // Location (mock data based on address)
          if (student.address) {
            const location = student.address.split(',').pop()?.trim() || 'Unknown';
            locations[location] = (locations[location] || 0) + 1;
          }
        });

        return NextResponse.json({
          success: true,
          data: {
            demographics: {
              ageDistribution: Object.entries(ageGroups).map(([range, count]) => ({
                ageRange: range,
                count
              })),
              locationDistribution: Object.entries(locations).map(([location, count]) => ({
                location,
                count
              })),
              genderDistribution: genderDistribution.map(item => ({
                gender: item.gender || 'Not specified',
                count: item._count,
                percentage: Math.round((item._count / demographics.length) * 100)
              }))
            },
            total: demographics.length
          }
        });

      default:
        return NextResponse.json({ 
          error: 'Invalid report type. Available types: overview, detailed, performance, attendance, demographics' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Students reports error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
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