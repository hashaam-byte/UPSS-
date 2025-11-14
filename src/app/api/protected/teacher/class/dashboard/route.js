// src/app/api/protected/teacher/class/dashboard/route.js - FIXED VERSION
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Helper function to verify class teacher access
async function verifyClassTeacherAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }, 
      school: true 
    }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'class_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

export async function GET(request) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    const classTeacher = await verifyClassTeacherAccess(token);

    // Get assigned class
    const assignedClasses = classTeacher.teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [];
    const classNames = [...new Set(assignedClasses)];

    if (classNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          assignedClasses: [],
          students: [],
          attendance: { present: 0, absent: 0, total: 0 },
          messages: [],
          alerts: [],
          summary: {
            totalStudents: 0,
            presentToday: 0,
            atRiskStudents: 0,
            unreadMessages: 0
          },
          message: 'No class assigned to this teacher'
        }
      });
    }

    // Get students in assigned classes
    const students = await prisma.user.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: classNames
          }
        }
      },
      include: {
        studentProfile: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        date: {
          gte: today,
          lt: tomorrow
        },
        studentId: {
          in: students.map(s => s.id)
        }
      }
    });

    const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentCount = todayAttendance.filter(a => a.status === 'absent').length;

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { toUserId: classTeacher.id },
          { fromUserId: classTeacher.id }
        ],
        schoolId: classTeacher.schoolId
      },
      include: {
        fromUser: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        toUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Get active alerts
    const activeAlerts = await prisma.studentAlert.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        status: 'active',
        studentId: {
          in: students.map(s => s.id)
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Calculate at-risk students
    const atRiskStudentIds = new Set();
    
    // Check attendance patterns
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        studentId: {
          in: students.map(s => s.id)
        },
        date: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Group by student
    const attendanceByStudent = {};
    recentAttendance.forEach(record => {
      if (!attendanceByStudent[record.studentId]) {
        attendanceByStudent[record.studentId] = { total: 0, present: 0 };
      }
      attendanceByStudent[record.studentId].total++;
      if (record.status === 'present' || record.status === 'late') {
        attendanceByStudent[record.studentId].present++;
      }
    });

    // Mark students with < 75% attendance as at-risk
    Object.entries(attendanceByStudent).forEach(([studentId, data]) => {
      if (data.total > 0 && (data.present / data.total) < 0.75) {
        atRiskStudentIds.add(studentId);
      }
    });

    // Add students with active alerts
    activeAlerts.forEach(alert => {
      atRiskStudentIds.add(alert.studentId);
    });

    return NextResponse.json({
      success: true,
      data: {
        assignedClasses: classNames,
        students: students.map(s => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email,
          isActive: s.isActive,
          profile: s.studentProfile
        })),
        attendance: {
          present: presentCount,
          absent: absentCount,
          total: todayAttendance.length
        },
        messages: recentMessages.map(m => ({
          id: m.id,
          subject: m.subject,
          content: m.content,
          isRead: m.isRead,
          createdAt: m.createdAt,
          fromUser: m.fromUser,
          toUser: m.toUser
        })),
        alerts: activeAlerts,
        summary: {
          totalStudents: students.length,
          presentToday: presentCount,
          atRiskStudents: atRiskStudentIds.size,
          unreadMessages: recentMessages.filter(m => !m.isRead && m.toUserId === classTeacher.id).length
        },
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          email: classTeacher.email
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}