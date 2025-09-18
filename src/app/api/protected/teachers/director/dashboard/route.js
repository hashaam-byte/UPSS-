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

    // Verify user is a director
    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        teacherProfile: true,
        school: true
      }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get director's stage (assume first subject in subjects array is the stage)
    const directorStage = director.teacherProfile.subjects[0];

    // Get total students in director's stage
    const totalStudents = await prisma.user.count({
      where: {
        schoolId: director.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            startsWith: directorStage
          }
        }
      }
    });

    // Get total teachers under supervision
    const totalTeachers = await prisma.user.count({
      where: {
        schoolId: director.schoolId,
        role: 'teacher',
        isActive: true,
        teacherProfile: {
          subjects: {
            hasSome: [directorStage]
          }
        }
      }
    });

    // Get pending timetable approvals (real data if you have a Timetable model)
    let pendingApprovals = 0;
    if (prisma.timetable) {
      pendingApprovals = await prisma.timetable.count({
        where: {
          stage: directorStage,
          status: 'pending'
        }
      });
    }

    // Get recent performance alerts (students with low grades, if you have a Result model)
    let performanceAlerts = [];
    if (prisma.result) {
      const lowResults = await prisma.result.findMany({
        where: {
          schoolId: director.schoolId,
          className: { startsWith: directorStage },
          average: { lt: 50 }
        },
        include: {
          student: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });
      performanceAlerts = lowResults.map(r => ({
        id: r.student.id,
        name: `${r.student.firstName} ${r.student.lastName}`,
        class: r.className,
        alert: 'Low performance detected',
        timestamp: r.updatedAt
      }));
    }

    // Calculate average pass rate (if you have a Result model)
    let averagePassRate = null;
    if (prisma.result) {
      const results = await prisma.result.findMany({
        where: {
          schoolId: director.schoolId,
          className: { startsWith: directorStage }
        }
      });
      if (results.length > 0) {
        const passCount = results.filter(r => r.average >= 50).length;
        averagePassRate = (passCount / results.length) * 100;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        director: {
          id: director.id,
          name: `${director.firstName} ${director.lastName}`,
          stage: directorStage,
          department: director.teacherProfile.department
        },
        stats: {
          totalStudents,
          totalTeachers,
          averagePassRate,
          pendingApprovals
        },
        recentAlerts: performanceAlerts
      }
    });

  } catch (error) {
    console.error('Director dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
