// /app/api/protected/teacher/class/attendance/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const period = searchParams.get('period') || 'all';
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    if (assignedClasses.length === 0) {
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
        schoolId: user.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: assignedClasses
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
    // For now, generate mock attendance data
    const mockAttendanceData = students.map(student => {
      const attendanceRecords = [];
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
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
              markedBy: user.id,
              markedAt: new Date()
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        const status = Math.random() > 0.15 ? 'present' : 
                      Math.random() > 0.7 ? 'late' : 'absent';
        
        attendanceRecords.push({
          studentId: student.id,
          date: date,
          status: status,
          arrivalTime: status === 'present' ? '08:00' : 
                      status === 'late' ? '08:15' : null,
          notes: status === 'absent' ? 'No reason provided' : null,
          markedBy: user.id,
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
        assignedClasses: assignedClasses,
        attendance: mockAttendanceData,
        summary: summary,
        teacherInfo: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          assignedClasses: assignedClasses
        }
      }
    });

  } catch (error) {
    console.error('Class teacher attendance GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Mark attendance for students
export async function POST(request) {
  try {
    const user = await requireAuth(['class_teacher']);
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

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    if (assignedClasses.length === 0) {
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
            schoolId: user.schoolId,
            role: 'student',
            isActive: true,
            studentProfile: {
              className: {
                in: assignedClasses
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

        // TODO: In production, save to actual attendance table
        results.successful.push({
          studentId: studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          status: status,
          arrivalTime: arrivalTime || null,
          notes: notes || null
        });

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing attendance record
export async function PUT(request) {
  try {
    const user = await requireAuth(['class_teacher']);
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

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    // Verify student belongs to teacher's class
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: assignedClasses
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found in your assigned class'
      }, { status: 404 });
    }

    // TODO: In production, update actual attendance record

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}