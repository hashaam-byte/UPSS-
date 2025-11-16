// /app/api/protected/teacher/class/students/route.js - CASE-INSENSITIVE VERSION
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

// Helper function to normalize class names for comparison
function normalizeClassName(className) {
  if (!className) return '';
  
  // Convert to uppercase and remove extra spaces
  return className.trim().toUpperCase().replace(/\s+/g, ' ');
}

// Helper function to check if two class names match (case-insensitive)
function classNamesMatch(class1, class2) {
  return normalizeClassName(class1) === normalizeClassName(class2);
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyClassTeacherAccess(token);
    
    const schoolId = user.schoolId;
    const userId = user.id;
    
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('className');
    const sortBy = searchParams.get('sortBy') || 'firstName';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: userId },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [];
    
    if (assignedClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          assignedClasses: [],
          pagination: {
            total: 0,
            page: 1,
            limit: limit,
            pages: 0
          },
          message: 'No class assigned to this class teacher'
        }
      });
    }

    // ✅ FIX: Normalize assigned classes for case-insensitive comparison
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));
    const classNames = [...new Set(assignedClasses)]; // Keep original casing for display

    // ✅ FIX: Get ALL students from the school, then filter in-memory for case-insensitive matching
    let allStudentsInSchool = await prisma.user.findMany({
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
      }
    });

    // ✅ FIX: Filter students by normalized class names (case-insensitive)
    let matchingStudents = allStudentsInSchool.filter(student => {
      const studentClassName = student.studentProfile?.className;
      if (!studentClassName) return false;
      
      const normalizedStudentClass = normalizeClassName(studentClassName);
      
      // Check if student's class matches any of the teacher's assigned classes (case-insensitive)
      return normalizedAssignedClasses.includes(normalizedStudentClass);
    });

    // Apply search filter
    if (search) {
      matchingStudents = matchingStudents.filter(student => {
        const searchLower = search.toLowerCase();
        return (
          student.firstName?.toLowerCase().includes(searchLower) ||
          student.lastName?.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          student.studentProfile?.studentId?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply class name filter if specified
    if (className) {
      const normalizedFilterClass = normalizeClassName(className);
      matchingStudents = matchingStudents.filter(student => {
        return normalizeClassName(student.studentProfile?.className) === normalizedFilterClass;
      });
    }

    const totalStudents = matchingStudents.length;

    // Apply sorting
    matchingStudents.sort((a, b) => {
      switch (sortBy) {
        case 'lastName':
          return (a.lastName || '').localeCompare(b.lastName || '') || 
                 (a.firstName || '').localeCompare(b.firstName || '');
        case 'studentId':
          return (a.studentProfile?.studentId || '').localeCompare(b.studentProfile?.studentId || '');
        case 'className':
          return (a.studentProfile?.className || '').localeCompare(b.studentProfile?.className || '') ||
                 (a.firstName || '').localeCompare(b.firstName || '');
        case 'firstName':
        default:
          return (a.firstName || '').localeCompare(b.firstName || '') || 
                 (a.lastName || '').localeCompare(b.lastName || '');
      }
    });

    // Apply pagination
    const paginatedStudents = matchingStudents.slice((page - 1) * limit, page * limit);

    // Get performance data for each student
    const studentsWithPerformance = await Promise.all(
      paginatedStudents.map(async (student) => {
        // Get attendance rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            schoolId: schoolId,
            date: { gte: thirtyDaysAgo }
          }
        });

        const attendanceRate = attendanceRecords.length > 0
          ? Math.round(
              (attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length / 
              attendanceRecords.length) * 100
            )
          : 0;

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

        const overallAverage = grades.length > 0
          ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length)
          : 0;

        const totalGrades = grades.length;

        // Check if at risk
        const isAtRisk = attendanceRate < 75 || overallAverage < 60;

        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          avatar: student.avatar,
          isActive: student.isActive,
          profile: student.studentProfile ? {
            studentId: student.studentProfile.studentId,
            className: student.studentProfile.className, // ✅ Return original casing
            section: student.studentProfile.section,
            department: student.studentProfile.department,
            parentName: student.studentProfile.parentName,
            parentPhone: student.studentProfile.parentPhone,
            parentEmail: student.studentProfile.parentEmail,
            admissionDate: student.studentProfile.admissionDate
          } : null,
          performance: {
            attendanceRate,
            overallAverage,
            totalGrades,
            isAtRisk
          },
          lastUpdated: student.updatedAt
        };
      })
    );

    // ✅ FIX: Calculate class statistics with case-insensitive grouping
    const classStats = {
      totalStudents: totalStudents,
      activeStudents: matchingStudents.filter(s => s.isActive).length,
      byClass: {}
    };

    // Group students by normalized class name
    const classGroups = {};
    matchingStudents.forEach(student => {
      const className = student.studentProfile?.className;
      if (className) {
        const normalized = normalizeClassName(className);
        if (!classGroups[normalized]) {
          classGroups[normalized] = {
            displayName: className, // Use first occurrence for display
            count: 0
          };
        }
        classGroups[normalized].count++;
      }
    });

    // Convert to display format
    Object.values(classGroups).forEach(group => {
      classStats.byClass[group.displayName] = group.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        students: studentsWithPerformance,
        assignedClasses: classNames, // Original casing
        classStats: classStats,
        pagination: {
          total: totalStudents,
          page: page,
          limit: limit,
          pages: Math.ceil(totalStudents / limit)
        },
        teacherInfo: {
          id: userId,
          name: `${user.firstName} ${user.lastName}`,
          employeeId: teacherProfile?.employeeId,
          assignedClasses: classNames
        },
        debugInfo: {
          normalizedAssignedClasses: normalizedAssignedClasses,
          totalStudentsInSchool: allStudentsInSchool.length,
          matchingStudentsCount: matchingStudents.length
        }
      }
    });

  } catch (error) {
    console.error('Class teacher students GET error:', error);
    
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

// POST - Create student alert or flag (unchanged)
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyClassTeacherAccess(token);
    
    const schoolId = user.schoolId;
    const userId = user.id;
    
    const body = await request.json();
    const { studentId, alertType, message, priority = 'normal', notifyParent = false } = body;

    if (!studentId || !alertType || !message) {
      return NextResponse.json({
        error: 'Student ID, alert type, and message are required'
      }, { status: 400 });
    }

    // Get assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: userId },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [];
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    // ✅ FIX: Verify student belongs to teacher's class (case-insensitive)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: schoolId,
        role: 'student',
        isActive: true
      },
      include: {
        studentProfile: true
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found in your school'
      }, { status: 404 });
    }

    // Check if student's class matches teacher's assigned classes (case-insensitive)
    const studentClassName = student.studentProfile?.className;
    const normalizedStudentClass = normalizeClassName(studentClassName);
    
    if (!normalizedAssignedClasses.includes(normalizedStudentClass)) {
      return NextResponse.json({
        error: 'Student not found in your assigned class'
      }, { status: 404 });
    }

    // Create student alert
    const alert = await prisma.studentAlert.create({
      data: {
        studentId: studentId,
        schoolId: schoolId,
        createdBy: userId,
        alertType: alertType,
        priority: priority,
        title: `Class Teacher Alert: ${alertType.replace(/_/g, ' ')}`,
        description: message,
        status: 'active'
      }
    });

    // Create notification for the student
    await prisma.notification.create({
      data: {
        userId: studentId,
        schoolId: schoolId,
        title: `Class Teacher Alert: ${alertType.replace(/_/g, ' ')}`,
        content: message,
        type: priority === 'high' ? 'warning' : 'info',
        priority: priority,
        isRead: false
      }
    });

    // Optionally notify parent
    if (notifyParent && student.studentProfile?.parentEmail) {
      console.log(`Parent notification would be sent to: ${student.studentProfile.parentEmail}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Student alert created successfully',
      data: {
        alertId: alert.id,
        studentId: studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        alertType: alertType,
        createdAt: alert.createdAt
      }
    });

  } catch (error) {
    console.error('Create student alert error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}