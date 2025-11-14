// /app/api/protected/teacher/class/students/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('className');
    const sortBy = searchParams.get('sortBy') || 'firstName';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get teacher profile and assigned classes - SAME AS DASHBOARD
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);
    
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

    const classNames = assignedClasses;

    // Build where conditions
    let whereConditions = {
      schoolId: user.schoolId, // FIXED: Use `user.schoolId` instead of `classTeacher.schoolId`
      role: 'student',
      isActive: true,
      studentProfile: {
        className: {
          in: className ? [className] : assignedClasses
        }
      }
    };

    // Add search filter
    if (search) {
      whereConditions.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { 
          studentProfile: {
            studentId: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Get total count
    const totalStudents = await prisma.user.count({
      where: whereConditions
    });

    // Build order by
    let orderBy;
    switch (sortBy) {
      case 'lastName':
        orderBy = [{ lastName: 'asc' }, { firstName: 'asc' }];
        break;
      case 'studentId':
        orderBy = [{ studentProfile: { studentId: 'asc' } }];
        break;
      case 'className':
        orderBy = [{ studentProfile: { className: 'asc' } }, { firstName: 'asc' }];
        break;
      case 'firstName':
      default:
        orderBy = [{ firstName: 'asc' }, { lastName: 'asc' }];
        break;
    }

    // Get students with pagination
    const students = await prisma.user.findMany({
      where: whereConditions,
      include: {
        studentProfile: true
      },
      orderBy: orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Format student data
    const formattedStudents = students.map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      avatar: student.avatar,
      isActive: student.isActive,
      profile: student.studentProfile ? {
        studentId: student.studentProfile.studentId,
        className: student.studentProfile.className,
        section: student.studentProfile.section,
        department: student.studentProfile.department,
        parentName: student.studentProfile.parentName,
        parentPhone: student.studentProfile.parentPhone,
        parentEmail: student.studentProfile.parentEmail,
        admissionDate: student.studentProfile.admissionDate
      } : null,
      lastUpdated: student.updatedAt
    }));

    // Get class statistics
    const classStats = {
      totalStudents: totalStudents,
      activeStudents: students.filter(s => s.isActive).length,
      byClass: {}
    };

    // Group students by class
    for (const className of classNames) {
      const classStudentCount = await prisma.user.count({
        where: {
          schoolId: user.schoolId, // FIXED: Use `user.schoolId` instead of `classTeacher.schoolId`
          role: 'student',
          isActive: true,
          studentProfile: {
            className: className
          }
        }
      });
      classStats.byClass[className] = classStudentCount;
    }

    return NextResponse.json({
      success: true,
      data: {
        students: formattedStudents,
        assignedClasses: classNames,
        classStats: classStats,
        pagination: {
          total: totalStudents,
          page: page,
          limit: limit,
          pages: Math.ceil(totalStudents / limit)
        },
        teacherInfo: {
          id: user.id, // FIXED: Use `user.id` instead of `classTeacher.id`
          name: `${user.firstName} ${user.lastName}`, // FIXED: Use `user.firstName` and `user.lastName`
          employeeId: teacherProfile?.employeeId,
          assignedClasses: classNames
        }
      }
    });

  } catch (error) {
    console.error('Class teacher students GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Not a class teacher/coordinator') {
      return NextResponse.json({ error: 'Access denied: Not a class coordinator' }, { status: 403 });
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

// POST - Create student alert or flag
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { studentId, alertType, message, priority = 'normal', notifyParent = false } = body;

    if (!studentId || !alertType || !message) {
      return NextResponse.json({
        error: 'Student ID, alert type, and message are required'
      }, { status: 400 });
    }

    // Get assigned class names
    const coordinatorClasses = classTeacher.teacherProfile?.teacherClassCoordinators || [];
    const classNames = coordinatorClasses.map(cc => cc.class.name);

    // Verify student belongs to teacher's class
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId, // FIXED: Use `user.schoolId` instead of `classTeacher.schoolId`
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
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found in your assigned class'
      }, { status: 404 });
    }

    // Create notification for the student
    await prisma.notification.create({
      data: {
        userId: studentId,
        schoolId: user.schoolId, // FIXED: Use `user.schoolId` instead of `classTeacher.schoolId`
        title: `Class Teacher Alert: ${alertType}`,
        content: message,
        type: priority === 'high' ? 'warning' : 'info',
        priority: priority,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Student alert created successfully',
      data: {
        studentId: studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        alertType: alertType,
        createdAt: new Date()
      }
    });

  } catch (error) {
    console.error('Create student alert error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Not a class teacher/coordinator') {
      return NextResponse.json({ error: 'Access denied: Not a class coordinator' }, { status: 403 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}