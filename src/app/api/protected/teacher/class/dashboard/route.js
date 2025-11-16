// src/app/api/protected/teacher/class/dashboard/route.js - CASE-INSENSITIVE VERSION
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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

// ✅ FIX: Helper function to normalize class names for comparison
function normalizeClassName(className) {
  if (!className) return '';
  return className.trim().toUpperCase().replace(/\s+/g, ' ');
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

    const user = await verifyClassTeacherAccess(token);
    
    const schoolId = user.schoolId;
    const userId = user.id;

    // Get assigned classes
    const assignedClasses = user.teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [];
    const classNames = [...new Set(assignedClasses)];

    if (classNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          assignedClasses: [],
          students: [],
          attendance: { present: 0, absent: 0, total: 0, rate: 0 },
          messages: [],
          alerts: [],
          summary: {
            totalStudents: 0,
            presentToday: 0,
            atRiskCount: 0,
            unreadMessages: 0,
            averagePerformance: 0,
            averageAttendance: 0
          },
          message: 'No class assigned to this teacher'
        }
      });
    }

    // ✅ FIX: Normalize assigned classes for case-insensitive comparison
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    // ✅ FIX: Get ALL students from school, then filter case-insensitively
    const allStudentsInSchool = await prisma.user.findMany({
      where: {
        schoolId: schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            not: null
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

    // Filter students by normalized class names (case-insensitive)
    const students = allStudentsInSchool.filter(student => {
      const studentClassName = student.studentProfile?.className;
      if (!studentClassName) return false;
      
      const normalizedStudentClass = normalizeClassName(studentClassName);
      return normalizedAssignedClasses.includes(normalizedStudentClass);
    });

    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        schoolId: schoolId,
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
    const attendanceRate = todayAttendance.length > 0 
      ? Math.round((presentCount / todayAttendance.length) * 100)
      : 0;

    // Get recent messages
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { toUserId: userId },
          { fromUserId: userId }
        ],
        schoolId: schoolId
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
        schoolId: schoolId,
        status: 'active',
        studentId: {
          in: students.map(s => s.id)
        }
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            studentProfile: {
              select: {
                className: true,
                studentId: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Calculate at-risk students
    const atRiskStudentIds = new Set();
    
    // Check attendance patterns (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        schoolId: schoolId,
        studentId: {
          in: students.map(s => s.id)
        },
        date: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Group attendance by student
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

    // Calculate performance metrics for students
    const studentsWithPerformance = await Promise.all(
      students.map(async (student) => {
        // Get recent grades
        const grades = await prisma.grade.findMany({
          where: {
            studentId: student.id,
            schoolId: schoolId
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        });

        const averageGrade = grades.length > 0
          ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length)
          : 0;

        // Get attendance rate
        const studentAttendance = attendanceByStudent[student.id];
        const studentAttendanceRate = studentAttendance && studentAttendance.total > 0
          ? Math.round((studentAttendance.present / studentAttendance.total) * 100)
          : 0;

        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          avatar: student.avatar,
          isActive: student.isActive,
          profile: student.studentProfile,
          performance: {
            averageGrade,
            attendanceRate: studentAttendanceRate,
            isAtRisk: atRiskStudentIds.has(student.id)
          }
        };
      })
    );

    // Calculate overall statistics
    const averagePerformance = studentsWithPerformance.length > 0
      ? Math.round(
          studentsWithPerformance.reduce((sum, s) => sum + (s.performance?.averageGrade || 0), 0) / 
          studentsWithPerformance.length
        )
      : 0;

    const averageAttendance = studentsWithPerformance.length > 0
      ? Math.round(
          studentsWithPerformance.reduce((sum, s) => sum + (s.performance?.attendanceRate || 0), 0) / 
          studentsWithPerformance.length
        )
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        assignedClasses: classNames,
        students: studentsWithPerformance,
        attendance: {
          present: presentCount,
          absent: absentCount,
          total: todayAttendance.length,
          rate: attendanceRate
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
        alerts: activeAlerts.map(alert => ({
          id: alert.id,
          alertType: alert.alertType,
          title: alert.title,
          description: alert.description,
          priority: alert.priority,
          status: alert.status,
          createdAt: alert.createdAt,
          student: alert.student
        })),
        summary: {
          totalStudents: students.length,
          presentToday: presentCount,
          atRiskCount: atRiskStudentIds.size,
          unreadMessages: recentMessages.filter(m => !m.isRead && m.toUserId === userId).length,
          averagePerformance,
          averageAttendance
        },
        teacherInfo: {
          id: userId,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          department: user.teacherProfile?.department
        },
        debugInfo: {
          normalizedAssignedClasses: normalizedAssignedClasses,
          totalStudentsInSchool: allStudentsInSchool.length,
          matchingStudentsCount: students.length
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