// app/api/protected/teachers/director/teachers/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const teacherId = params.id;

    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: user.schoolId,
        role: 'teacher',
        isActive: true
      },
      include: {
        teacherProfile: {
          include: {
            teacherSubjects: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    category: true,
                    classes: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Get teacher's subjects
    const subjects = teacher.teacherProfile?.teacherSubjects?.map(ts => ({
      ...ts.subject,
      classes: ts.classes
    })) || [];

    // Get performance metrics
    const timetableCount = await prisma.timetable.count({
      where: {
        teacherId: teacher.id,
        schoolId: user.schoolId
      }
    });

    const gradesGiven = await prisma.grade.count({
      where: {
        teacherId: teacher.id,
        schoolId: user.schoolId
      }
    });

    const assignmentsCreated = await prisma.assignment.count({
      where: {
        teacherId: teacher.id,
        schoolId: user.schoolId
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          dateOfBirth: teacher.dateOfBirth,
          gender: teacher.gender,
          avatar: teacher.avatar,
          isActive: teacher.isActive,
          lastLogin: teacher.lastLogin,
          createdAt: teacher.createdAt,
          employeeId: teacher.teacherProfile?.employeeId,
          department: teacher.teacherProfile?.department,
          qualification: teacher.teacherProfile?.qualification,
          experienceYears: teacher.teacherProfile?.experienceYears,
          joiningDate: teacher.teacherProfile?.joiningDate,
          subjects,
          hasClassAssignment: timetableCount > 0
        },
        performanceMetrics: {
          timetableSlots: timetableCount,
          gradesGiven,
          assignmentsCreated,
          activeSubjects: subjects.length
        }
      }
    });
  } catch (error) {
    console.error('Teacher detail fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch teacher details' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const teacherId = params.id;
    const updates = await request.json();

    // Verify teacher exists and belongs to same school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: user.schoolId,
        role: 'teacher'
      },
      include: {
        teacherProfile: true
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Check email uniqueness if changed
    if (updates.email && updates.email !== teacher.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: updates.email,
          schoolId: user.schoolId,
          id: { not: teacherId }
        }
      });

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update user basic info
    await prisma.user.update({
      where: { id: teacherId },
      data: {
        firstName: updates.firstName,
        lastName: updates.lastName,
        email: updates.email,
        phone: updates.phone || null,
        address: updates.address || null,
        dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : null,
        gender: updates.gender || null,
        isActive: updates.isActive !== undefined ? updates.isActive : true
      }
    });

    // Update teacher profile if exists
    if (teacher.teacherProfile) {
      await prisma.teacherProfile.update({
        where: { userId: teacherId },
        data: {
          employeeId: updates.employeeId || null,
          department: updates.department || null,
          qualification: updates.qualification || null,
          experienceYears: parseInt(updates.experienceYears) || 0,
          joiningDate: updates.joiningDate ? new Date(updates.joiningDate) : null
        }
      });
    } else {
      // Create teacher profile if doesn't exist
      await prisma.teacherProfile.create({
        data: {
          userId: teacherId,
          employeeId: updates.employeeId || null,
          department: updates.department || null,
          qualification: updates.qualification || null,
          experienceYears: parseInt(updates.experienceYears) || 0,
          joiningDate: updates.joiningDate ? new Date(updates.joiningDate) : null
        }
      });
    }

    // Fetch updated teacher
    const updatedTeacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        teacherProfile: {
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        teacher: updatedTeacher,
        message: 'Teacher updated successfully'
      }
    });
  } catch (error) {
    console.error('Teacher update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update teacher' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const teacherId = params.id;

    // Verify teacher exists
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: user.schoolId,
        role: 'teacher'
      }
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      );
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id: teacherId },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher deactivated successfully'
    });
  } catch (error) {
    console.error('Teacher deactivation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to deactivate teacher' },
      { status: 500 }
    );
  }
}

// Teacher Performance Report
export async function GET_PERFORMANCE(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const teacherId = params.id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'term';

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'term':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 3));
    }

    // Get teacher's timetable load
    const timetableSlots = await prisma.timetable.findMany({
      where: {
        teacherId,
        schoolId: user.schoolId,
        createdAt: { gte: startDate }
      },
      include: {
        school: true
      }
    });

    // Get assignments created
    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId,
        schoolId: user.schoolId,
        createdAt: { gte: startDate }
      },
      include: {
        submissions: true
      }
    });

    // Get grades given
    const grades = await prisma.grade.findMany({
      where: {
        teacherId,
        schoolId: user.schoolId,
        createdAt: { gte: startDate }
      }
    });

    // Calculate metrics
    const totalSlots = timetableSlots.length;
    const uniqueClasses = [...new Set(timetableSlots.map(t => t.className))].length;
    const uniqueSubjects = [...new Set(timetableSlots.map(t => t.subject))].length;

    const totalAssignments = assignments.length;
    const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
    const gradedSubmissions = assignments.reduce((sum, a) => 
      sum + a.submissions.filter(s => s.status === 'graded').length, 0
    );
    const gradingRate = totalSubmissions > 0 
      ? Math.round((gradedSubmissions / totalSubmissions) * 100) 
      : 0;

    const totalGrades = grades.length;
    const averageGrade = totalGrades > 0
      ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / totalGrades)
      : 0;

    // Teaching load analysis
    const periodsPerWeek = totalSlots;
    const loadStatus = periodsPerWeek > 25 ? 'overloaded' : periodsPerWeek > 20 ? 'high' : 'normal';

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          timetableSlots: totalSlots,
          classesTeaching: uniqueClasses,
          subjectsTeaching: uniqueSubjects,
          assignmentsCreated: totalAssignments,
          gradesGiven: totalGrades,
          gradingRate,
          averageGrade,
          periodsPerWeek,
          loadStatus
        },
        details: {
          assignments: assignments.map(a => ({
            id: a.id,
            title: a.title,
            dueDate: a.dueDate,
            submissions: a.submissions.length,
            graded: a.submissions.filter(s => s.status === 'graded').length
          })),
          timetable: timetableSlots.map(t => ({
            className: t.className,
            subject: t.subject,
            dayOfWeek: t.dayOfWeek,
            period: t.period,
            startTime: t.startTime,
            endTime: t.endTime
          }))
        },
        recommendations: {
          workloadStatus: loadStatus,
          needsSupport: periodsPerWeek > 25,
          gradingPerformance: gradingRate >= 80 ? 'excellent' : gradingRate >= 60 ? 'good' : 'needs improvement'
        }
      }
    });
  } catch (error) {
    console.error('Performance report error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate performance report' },
      { status: 500 }
    );
  }
}