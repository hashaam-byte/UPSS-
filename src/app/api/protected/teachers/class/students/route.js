// /app/api/protected/teacher/class/students/route.js
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

export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('className');
    const sortBy = searchParams.get('sortBy') || 'firstName';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get assigned classes
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      // If no coordinator class, get classes from teacher subjects
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    if (classNames.length === 0) {
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

    // Build where conditions
    let whereConditions = {
      schoolId: classTeacher.schoolId,
      role: 'student',
      isActive: true,
      studentProfile: {
        className: {
          in: className ? [className] : classNames
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
      // Note: In production, performance data would be calculated from actual tables
      performance: {
        overallAverage: null, // Would be calculated from grades table
        trend: 'stable',
        attendance: {
          rate: null, // Would be calculated from attendance table
          daysPresent: 0,
          totalDays: 0
        },
        assignments: {
          total: 0,
          submitted: 0,
          pending: 0,
          submissionRate: 0
        }
      },
      alerts: [], // Would come from alerts/flags table
      lastUpdated: student.updatedAt
    }));

    // Get class statistics
    const classStats = {
      totalStudents: totalStudents,
      activeStudents: students.filter(s => s.isActive).length,
      byClass: {}
    };

    // Group students by class
    classNames.forEach(className => {
      const classStudents = students.filter(s => s.studentProfile?.className === className);
      classStats.byClass[className] = classStudents.length;
    });

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
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          employeeId: classTeacher.teacherProfile?.employeeId,
          assignedClasses: classNames
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
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

    // Verify student belongs to teacher's class
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
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
        schoolId: classTeacher.schoolId,
        title: `Class Teacher Alert: ${alertType}`,
        content: message,
        type: priority === 'high' ? 'warning' : 'info',
        priority: priority,
        isRead: false
      }
    });

    // TODO: In production, you might also:
    // - Create entry in student_alerts table
    // - Send email/SMS to parent if notifyParent is true
    // - Log in audit trail

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
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}