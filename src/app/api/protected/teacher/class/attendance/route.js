// /app/api/protected/teacher/class/attendance/route.js - CASE-INSENSITIVE VERSION
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Helper function to normalize class names for comparison
function normalizeClassName(className) {
  if (!className) return '';
  return className.trim().toUpperCase().replace(/\s+/g, ' ');
}

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

    // ✅ FIX: Normalize assigned classes for case-insensitive comparison
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    // ✅ FIX: Get ALL students from school, then filter case-insensitively
    const allStudentsInSchool = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'STUDENT',
        isActive: true,
        studentProfile: {
          className: {
            not: null
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

    // Filter students by normalized class names (case-insensitive)
    const students = allStudentsInSchool.filter(student => {
      const studentClassName = student.studentProfile?.className;
      if (!studentClassName) return false;
      
      const normalizedStudentClass = normalizeClassName(studentClassName);
      return normalizedAssignedClasses.includes(normalizedStudentClass);
    });

    // Build the date range to query real attendance records for
    const studentIds = students.map(s => s.id);
    const rangeStart = startDate ? new Date(startDate) : new Date(date);
    const rangeEnd = endDate ? new Date(endDate) : new Date(date);

    const dbAttendanceRecords = studentIds.length > 0
      ? await prisma.attendance.findMany({
          where: {
            studentId: { in: studentIds },
            schoolId: user.schoolId,
            date: { gte: rangeStart, lte: rangeEnd },
            ...(period !== 'all' && { period })
          },
          orderBy: { date: 'asc' }
        })
      : [];

    // Group real records by student
    const recordsByStudent = new Map();
    for (const rec of dbAttendanceRecords) {
      if (!recordsByStudent.has(rec.studentId)) recordsByStudent.set(rec.studentId, []);
      recordsByStudent.get(rec.studentId).push({
        studentId: rec.studentId,
        date: rec.date.toISOString().split('T')[0],
        status: rec.status.toLowerCase(),
        arrivalTime: rec.arrivalTime,
        notes: rec.notes,
        markedBy: rec.markedBy,
        markedAt: rec.markedAt
      });
    }

    const attendanceData = students.map(student => ({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`,
        studentId: student.studentProfile?.studentId,
        className: student.studentProfile?.className,
        avatar: student.avatar
      },
      attendance: recordsByStudent.get(student.id) || []
    }));

    // Calculate summary statistics
    const allAttendanceRecords = attendanceData.flatMap(item => item.attendance);
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
      const studentData = attendanceData[0];
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
        attendance: attendanceData,
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
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

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

        // ✅ FIX: Verify student belongs to teacher's class (case-insensitive)
        const student = await prisma.user.findFirst({
          where: {
            id: studentId,
            schoolId: user.schoolId,
            role: 'STUDENT',
            isActive: true
          },
          include: {
            studentProfile: true
          }
        });

        if (!student) {
          results.failed.push({
            studentId,
            error: 'Student not found'
          });
          continue;
        }

        // Check if student's class matches teacher's assigned classes (case-insensitive)
        const studentClassName = student.studentProfile?.className;
        const normalizedStudentClass = normalizeClassName(studentClassName);
        
        if (!normalizedAssignedClasses.includes(normalizedStudentClass)) {
          results.failed.push({
            studentId,
            error: 'Student not found in your assigned class'
          });
          continue;
        }

        // Upsert so re-marking the same student/date/period updates rather than duplicates
        await prisma.attendance.upsert({
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
            markedBy: user.id,
            markedAt: new Date()
          },
          create: {
            studentId: studentId,
            schoolId: user.schoolId,
            date: attendanceDate,
            period: period,
            status: status,
            arrivalTime: arrivalTime || null,
            notes: notes || null,
            markedBy: user.id
          }
        });

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
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    // ✅ FIX: Verify student belongs to teacher's class (case-insensitive)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        role: 'STUDENT',
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

    // Check if student's class matches teacher's assigned classes (case-insensitive)
    const studentClassName = student.studentProfile?.className;
    const normalizedStudentClass = normalizeClassName(studentClassName);
    
    if (!normalizedAssignedClasses.includes(normalizedStudentClass)) {
      return NextResponse.json({
        error: 'Student not found in your assigned class'
      }, { status: 404 });
    }

    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: studentId,
        date: attendanceDate,
        schoolId: user.schoolId
      }
    });

    if (!existing) {
      return NextResponse.json({
        error: 'No attendance record found for this student/date to update'
      }, { status: 404 });
    }

    const updated = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        status: status,
        arrivalTime: arrivalTime || null,
        notes: reason || notes || null,
        markedBy: user.id,
        markedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Attendance record updated successfully',
      data: {
        studentId: studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        date: date,
        status: updated.status,
        arrivalTime: updated.arrivalTime,
        notes: updated.notes,
        updatedAt: updated.markedAt
      }
    });

  } catch (error) {
    console.error('Update attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}