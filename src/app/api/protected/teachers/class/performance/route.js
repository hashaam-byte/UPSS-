// /app/api/protected/teacher/class/performance/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { requireAuth } from '@/lib/auth';

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
    const user = await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current_term';
    const subject = searchParams.get('subject') || 'all';
    const studentId = searchParams.get('studentId');

    // Get assigned classes
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

    if (classNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          classAnalytics: {
            totalStudents: 0,
            averagePerformance: 0,
            highPerformers: 0,
            atRiskStudents: 0
          },
          message: 'No class assigned to this class teacher'
        }
      });
    }

    // Get students in assigned classes
    const whereConditions = {
      schoolId: classTeacher.schoolId,
      role: 'student',
      isActive: true,
      studentProfile: {
        className: {
          in: classNames
        }
      }
    };

    // If specific student requested
    if (studentId) {
      whereConditions.id = studentId;
    }

    const students = await prisma.user.findMany({
      where: whereConditions,
      include: {
        studentProfile: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Get all subjects for the school (for performance tracking)
    const schoolSubjects = await prisma.subject.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        isActive: true,
        classes: {
          hasSome: classNames
        }
      }
    });

    // Calculate performance data for each student
    // Note: In a real system, this would come from actual grades/assignments/assessments tables
    const studentsWithPerformance = await Promise.all(
      students.map(async (student) => {
        const baseData = {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          avatar: student.avatar,
          profile: {
            studentId: student.studentProfile?.studentId,
            className: student.studentProfile?.className,
            section: student.studentProfile?.section,
            department: student.studentProfile?.department,
            parentName: student.studentProfile?.parentName,
            parentPhone: student.studentProfile?.parentPhone,
            parentEmail: student.studentProfile?.parentEmail
          },
          performance: {
            overallAverage: null,
            trend: 'stable',
            subjects: {},
            attendance: {
              rate: null,
              daysPresent: 0,
              totalDays: 0
            },
            assignments: {
              total: 0,
              submitted: 0,
              pending: 0,
              submissionRate: 0
            },
            lastUpdated: new Date()
          },
          alerts: [],
          recommendations: []
        };

        // TODO: In production, calculate from actual data:
        // - Query grades/results table for subject scores
        // - Query attendance table for attendance data
        // - Query assignments table for assignment completion
        // - Calculate trends from historical data

        // For now, this would be placeholder for the structure
        // but in your real implementation, you'd query these tables:
        /*
        const grades = await prisma.grade.findMany({
          where: { studentId: student.id, term: period },
          include: { subject: true }
        });

        const attendance = await prisma.attendance.findMany({
          where: { studentId: student.id, term: period }
        });

        const assignments = await prisma.assignment.findMany({
          where: { 
            studentId: student.id,
            dueDate: { gte: termStartDate, lte: termEndDate }
          }
        });
        */

        return baseData;
      })
    );

    // Calculate class-wide analytics
    const classAnalytics = {
      totalStudents: students.length,
      averagePerformance: null, // Calculate from actual grades
      highPerformers: 0, // Students with >85% average
      atRiskStudents: 0, // Students with <60% average
      attendanceRate: null, // Overall class attendance
      subjectPerformance: {},
      trendAnalysis: {
        improving: 0,
        stable: 0,
        declining: 0
      }
    };

    // Generate insights and recommendations
    const insights = [];
    const recommendations = [];

    if (studentsWithPerformance.length === 0) {
      insights.push({
        type: 'info',
        message: 'No student data available for the selected period',
        priority: 'low'
      });
    }

    // If specific student requested, return detailed view
    if (studentId && studentsWithPerformance.length === 1) {
      const student = studentsWithPerformance[0];
      
      return NextResponse.json({
        success: true,
        data: {
          student: student,
          performanceHistory: [], // TODO: Query historical performance
          subjectDetails: [], // TODO: Query subject-wise performance
          attendanceHistory: [], // TODO: Query attendance records
          assignmentHistory: [], // TODO: Query assignment records
          recommendations: student.recommendations,
          parentContactHistory: [] // TODO: Query communication log
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        students: studentsWithPerformance,
        classAnalytics: classAnalytics,
        assignedClasses: classNames,
        schoolSubjects: schoolSubjects.map(subject => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          category: subject.category
        })),
        insights: insights,
        recommendations: recommendations,
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          assignedClasses: classNames,
          employeeId: classTeacher.teacherProfile?.employeeId
        }
      }
    });

  } catch (error) {
    console.error('Class teacher performance error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create performance alert/flag for student
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { studentId, alertType, message, priority = 'normal' } = body;

    if (!studentId || !alertType || !message) {
      return NextResponse.json({
        error: 'Student ID, alert type, and message are required'
      }, { status: 400 });
    }

    // Verify the student belongs to this teacher's class
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: classTeacher.schoolId,
        role: 'student',
        isActive: true
      },
      include: {
        studentProfile: true
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found'
      }, { status: 404 });
    }

    // Create notification for the student
    await prisma.notification.create({
      data: {
        userId: studentId,
        schoolId: classTeacher.schoolId,
        title: `Performance Alert: ${alertType}`,
        content: message,
        type: 'warning',
        priority: priority,
        isRead: false
      }
    });

    // TODO: In production, you might also:
    // - Create an entry in a performance_alerts table
    // - Send notification to parents
    // - Log the action in audit trail

    return NextResponse.json({
      success: true,
      message: 'Performance alert created successfully'
    });

  } catch (error) {
    console.error('Create performance alert error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}