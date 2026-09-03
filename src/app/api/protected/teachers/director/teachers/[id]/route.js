// app/api/protected/teachers/director/teachers/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const user = await requireAuth(['TEACHER']);
    
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
        role: 'TEACHER',
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

export async function PUT(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const user = await requireAuth(['TEACHER']);
    
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
        role: 'TEACHER'
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

export async function DELETE(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const user = await requireAuth(['TEACHER']);
    
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
        role: 'TEACHER'
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
