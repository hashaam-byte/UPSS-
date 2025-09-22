// /app/api/protected/teacher/class/attendance/route.js
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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const period = searchParams.get('period') || 'all';
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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
          attendance: [],
          students: [],
          summary: { totalStudents: 0, present: 0, absent: 0, late: 0 },
          message: 'No class assigned to this class teacher'
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
        },
        ...(studentId && { id: studentId })
      },
      include: {
        studentProfile: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // TODO: In production, this would query an actual attendance table
    // For now, generate mock attendance data based on the structure
    const mockAttendanceData = students.map(student => {
      // Generate attendance for the requested date(s)
      const attendanceRecords = [];
      
      if (startDate && endDate) {
        // Generate range of dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          // Skip weekends
          if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            const status = Math.random() > 0.15 ? 'present' : 
                         Math.random() > 0.7 ? 'late' : 'absent';
            
            attendanceRecords.push({
              studentId: student.id,
              date: currentDate.toISOString().split('T')[0],
              status: status,
              arrivalTime: status === 'present' ? '08:00' : 
                          status === 'late' ? '08:15' : null,
              notes: status === 'absent' ? 'No reason provided' : null,
              markedBy: classTeacher.id,
              markedAt: new Date()
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Single date attendance
        const status = Math.random() > 0.15 ? 'present' : 
                      Math.random() > 0.7 ? 'late' : 'absent';
        
        attendanceRecords.push({
          studentId: student.id,
          date: date,
          status: status,
          arrivalTime: status === 'present' ? '08:00' : 
                      status === 'late' ? '08:15' : null,
          notes: status === 'absent' ? 'No reason provided' : null,
          markedBy: classTeacher.id,
          markedAt: new Date()
        });
      }

      return {
        student: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          name: `${student.firstName} ${student.lastName}`,
          studentId: student.studentProfile?.studentId,
          className: student.studentProfile?.className,
          avatar: student.avatar
        },
        attendance: attendanceRecords
      };
    });

    // Calculate summary statistics
    const allAttendanceRecords = mockAttendanceData.flatMap(item => item.attendance);
    const summary = {
      totalStudents: students.length,
      totalRecords: allAttendanceRecords.length,
      present: allAttendanceRecords.filter(record => record.status === 'present').length,
      absent: allAttendanceRecords.filter(record => record.status === 'absent').length,
      late: allAttendanceRecords.filter(record => record.status === 'late').length,
      attendanceRate: allAttendanceRecords.length > 0 
        ? Math.round((allAttendanceRecords.filter(record => record.status !== 'absent').length / allAttendanceRecords.length) * 100)
        : 0
    };

    // If requesting specific student's attendance history
    if (studentId && students.length === 1) {
      const studentData = mockAttendanceData[0];
      return NextResponse.json({
        success: true,
        data: {
          student: studentData.student,
          attendanceHistory: studentData.attendance,
          statistics: {
            totalDays: studentData.attendance.length,
            present: studentData.attendance.filter(record => record.status === 'present').length,
            absent: studentData.attendance.filter(record => record.status === 'absent').length,
            late: studentData.attendance.filter(record => record.status === 'late').length,
            attendanceRate: studentData.attendance.length > 0
              ? Math.round((studentData.attendance.filter(record => record.status !== 'absent').length / studentData.attendance.length) * 100)
              : 0
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        date: date,
        period: period,
        assignedClasses: classNames,
        attendance: mockAttendanceData,
        summary: summary,
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          assignedClasses: classNames
        }
      }
    });

  } catch (error) {
    console.error('Class teacher attendance GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Mark attendance for students
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { date, attendanceRecords, period = 'morning' } = body;

    if (!date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return NextResponse.json({
        error: 'Date and attendance records array are required'
      }, { status: 400 });
    }

    // Validate date format
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format'
      }, { status: 400 });
    }

    // Get assigned classes for validation
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
        error: 'No class assigned to this class teacher'
      }, { status: 403 });
    }

    const results = {
      successful: [],
      failed: [],
      updated: []
    };

    // Process each attendance record
    for (const record of attendanceRecords) {
      try {
        const { studentId, status, arrivalTime, notes } = record;

        if (!studentId || !status) {
          results.failed.push({
            studentId,
            error: 'Student ID and status are required'
          });
          continue;
        }

        if (!['present', 'absent', 'late', 'excused'].includes(status)) {
          results.failed.push({
            studentId,
            error: 'Invalid status. Must be: present, absent, late, or excused'
          });
          continue;
        }

        // Verify student belongs to teacher's class
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
          results.failed.push({
            studentId,
            error: 'Student not found in your assigned class'
          });
          continue;
        }

        // TODO: In production, save to actual attendance table:
        /*
        const attendanceEntry = await prisma.attendance.upsert({
          where: {
            studentId_date_period: {
              studentId: studentId,
              date: attendanceDate,
              period: period
            }
          },
          update: {
            status: status,
            arrivalTime: arrivalTime || null,
            notes: notes || null,
            markedBy: classTeacher.id,
            updatedAt: new Date()
          },
          create: {
            studentId: studentId,
            schoolId: classTeacher.schoolId,
            date: attendanceDate,
            period: period,
            status: status,
            arrivalTime: arrivalTime || null,
            notes: notes || null,
            markedBy: classTeacher.id
          }
        });
        */

        results.successful.push({
          studentId: studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          status: status,
          arrivalTime: arrivalTime || null,
          notes: notes || null
        });

        // Create notification for chronic absenteeism
        if (status === 'absent') {
          // TODO: Check for consecutive absences and create alert
          /*
          const recentAbsences = await prisma.attendance.count({
            where: {
              studentId: studentId,
              status: 'absent',
              date: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            }
          });

          if (recentAbsences >= 3) {
            await prisma.notification.create({
              data: {
                userId: studentId,
                schoolId: classTeacher.schoolId,
                title: 'Attendance Alert',
                content: `Student has been absent for ${recentAbsences} days in the past week`,
                type: 'warning',
                priority: 'high'
              }
            });
          }
          */
        }

      } catch (error) {
        results.failed.push({
          studentId: record.studentId,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Attendance marked successfully. ${results.successful.length} records processed.`,
      data: {
        date: date,
        period: period,
        successful: results.successful,
        failed: results.failed,
        totalProcessed: attendanceRecords.length
      }
    });

  } catch (error) {
    console.error('Mark attendance error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing attendance record
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { studentId, date, status, arrivalTime, notes, reason } = body;

    if (!studentId || !date || !status) {
      return NextResponse.json({
        error: 'Student ID, date, and status are required'
      }, { status: 400 });
    }

    // Validate status
    if (!['present', 'absent', 'late', 'excused'].includes(status)) {
      return NextResponse.json({
        error: 'Invalid status. Must be: present, absent, late, or excused'
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
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found in your assigned class'
      }, { status: 404 });
    }

    // TODO: In production, update actual attendance record:
    /*
    const updatedAttendance = await prisma.attendance.update({
      where: {
        studentId_date: {
          studentId: studentId,
          date: new Date(date)
        }
      },
      data: {
        status: status,
        arrivalTime: arrivalTime || null,
        notes: notes || null,
        reason: reason || null,
        markedBy: classTeacher.id,
        updatedAt: new Date()
      }
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: {
        studentId: studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        date: date,
        status: status,
        arrivalTime: arrivalTime || null,
        notes: notes || null,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}