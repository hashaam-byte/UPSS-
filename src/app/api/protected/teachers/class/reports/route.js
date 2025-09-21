// /app/api/protected/teacher/class/reports/route.js
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

// GET - Fetch available reports and report data
export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const format = searchParams.get('format') || 'json';
    const period = searchParams.get('period') || 'current_term';
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
          message: 'No class assigned to this class teacher',
          availableReports: []
        }
      });
    }

    // If no specific report type, return available report types
    if (!reportType) {
      const availableReports = [
        {
          id: 'class_performance',
          name: 'Class Performance Summary',
          description: 'Overall performance analysis of your assigned class',
          icon: 'BarChart3',
          estimatedTime: '2-3 minutes'
        },
        {
          id: 'student_progress',
          name: 'Individual Student Progress',
          description: 'Detailed progress report for individual students',
          icon: 'TrendingUp',
          estimatedTime: '1-2 minutes per student'
        },
        {
          id: 'attendance_report',
          name: 'Attendance Analysis',
          description: 'Attendance patterns and trends for your class',
          icon: 'Calendar',
          estimatedTime: '1-2 minutes'
        },
        {
          id: 'parent_communication',
          name: 'Parent Communication Log',
          description: 'Summary of all parent interactions and meetings',
          icon: 'MessageSquare',
          estimatedTime: '1 minute'
        },
        {
          id: 'behavior_incidents',
          name: 'Behavioral Incidents Report',
          description: 'Record of behavioral issues and interventions',
          icon: 'AlertTriangle',
          estimatedTime: '1-2 minutes'
        }
      ];

      return NextResponse.json({
        success: true,
        data: {
          availableReports,
          assignedClasses: classNames,
          teacherInfo: {
            id: classTeacher.id,
            name: `${classTeacher.firstName} ${classTeacher.lastName}`,
            assignedClasses: classNames
          }
        }
      });
    }

    // Get students for the reports
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

    let reportData = {};

    switch (reportType) {
      case 'class_performance':
        reportData = await generateClassPerformanceReport(students, classTeacher, period);
        break;
      
      case 'student_progress':
        if (studentId) {
          const student = students.find(s => s.id === studentId);
          if (!student) {
            return NextResponse.json({
              error: 'Student not found in your assigned class'
            }, { status: 404 });
          }
          reportData = await generateStudentProgressReport(student, classTeacher, period);
        } else {
          reportData = await generateAllStudentsProgressReport(students, classTeacher, period);
        }
        break;
      
      case 'attendance_report':
        reportData = await generateAttendanceReport(students, classTeacher, period);
        break;
      
      case 'parent_communication':
        reportData = await generateParentCommunicationReport(students, classTeacher, period);
        break;
      
      case 'behavior_incidents':
        reportData = await generateBehaviorIncidentsReport(students, classTeacher, period);
        break;
      
      default:
        return NextResponse.json({
          error: 'Invalid report type'
        }, { status: 400 });
    }

    // If format is PDF or Excel, you would generate and return file here
    if (format !== 'json') {
      // TODO: Implement PDF/Excel generation
      return NextResponse.json({
        error: 'PDF/Excel export not yet implemented'
      }, { status: 501 });
    }

    return NextResponse.json({
      success: true,
      data: {
        reportType,
        generatedAt: new Date(),
        period,
        assignedClasses: classNames,
        ...reportData
      }
    });

  } catch (error) {
    console.error('Class teacher reports error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions to generate different types of reports
async function generateClassPerformanceReport(students, teacher, period) {
  // TODO: In production, this would query actual grades/assessments tables
  const totalStudents = students.length;
  
  return {
    summary: {
      totalStudents,
      period,
      className: teacher.teacherProfile?.coordinatorClass,
      teacherName: `${teacher.firstName} ${teacher.lastName}`
    },
    performance: {
      averageGrade: null, // Calculate from actual grades
      topPerformers: [],
      strugglingStudents: [],
      subjectAnalysis: {},
      trendAnalysis: {
        improving: 0,
        stable: 0,
        declining: 0
      }
    },
    recommendations: [
      'Connect with actual grading system to generate meaningful insights'
    ]
  };
}

async function generateStudentProgressReport(student, teacher, period) {
  return {
    student: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      studentId: student.studentProfile?.studentId,
      className: student.studentProfile?.className
    },
    academicProgress: {
      currentGrade: null, // From grades table
      previousGrade: null,
      improvement: null,
      subjectBreakdown: {}
    },
    attendance: {
      rate: null, // From attendance table
      daysPresent: 0,
      totalDays: 0,
      patterns: []
    },
    behavioralNotes: [],
    recommendations: [],
    parentContacts: []
  };
}

async function generateAllStudentsProgressReport(students, teacher, period) {
  return {
    students: students.map(student => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      studentId: student.studentProfile?.studentId,
      currentGrade: null,
      attendanceRate: null,
      behavioralFlags: 0,
      lastParentContact: null
    })),
    summary: {
      totalStudents: students.length,
      averagePerformance: null,
      averageAttendance: null,
      studentsNeedingAttention: 0
    }
  };
}

async function generateAttendanceReport(students, teacher, period) {
  // TODO: Query attendance table
  return {
    summary: {
      totalStudents: students.length,
      averageAttendanceRate: null,
      perfectAttendance: 0,
      chronicAbsenteeism: 0
    },
    patterns: {
      dailyTrends: {},
      weeklyTrends: {},
      seasonalPatterns: {}
    },
    students: students.map(student => ({
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      attendanceRate: null,
      daysAbsent: 0,
      tardyInstances: 0,
      excusedAbsences: 0
    }))
  };
}

async function generateParentCommunicationReport(students, teacher, period) {
  // TODO: Query messages and communication logs
  return {
    summary: {
      totalContacts: 0,
      responseRate: null,
      averageResponseTime: null
    },
    communications: [],
    parentEngagement: students.map(student => ({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        parentName: student.studentProfile?.parentName,
        parentEmail: student.studentProfile?.parentEmail,
        parentPhone: student.studentProfile?.parentPhone
      },
      contactHistory: [],
      lastContact: null,
      engagementLevel: 'unknown'
    }))
  };
}

async function generateBehaviorIncidentsReport(students, teacher, period) {
  // TODO: Query behavioral incidents table
  return {
    summary: {
      totalIncidents: 0,
      studentsInvolved: 0,
      resolvedIncidents: 0,
      pendingIncidents: 0
    },
    incidents: [],
    patterns: {
      commonIssues: [],
      timePatterns: {},
      interventionEffectiveness: {}
    },
    recommendations: []
  };
}

// POST - Generate and save custom report
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { reportType, parameters = {}, saveReport = false } = body;

    if (!reportType) {
      return NextResponse.json({
        error: 'Report type is required'
      }, { status: 400 });
    }

    // Generate the report based on type and parameters
    // This would be similar to the GET logic above

    if (saveReport) {
      // TODO: Save report to database for later retrieval
      const savedReport = await prisma.coordinatorReport.create({
        data: {
          coordinatorId: classTeacher.id,
          reportType: `class_teacher_${reportType}`,
          reportData: { reportType, parameters },
          parameters: parameters,
          generatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Report generated and saved successfully',
        reportId: savedReport.id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Report generated successfully'
    });

  } catch (error) {
    console.error('Generate report error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}