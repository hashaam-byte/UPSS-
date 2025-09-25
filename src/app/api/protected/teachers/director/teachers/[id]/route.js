import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacherId = params.id;

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    // Verify user is a director
    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get teacher details with comprehensive information
    const teacher = await prisma.user.findUnique({
      where: { 
        id: teacherId,
        schoolId: director.schoolId, // Ensure teacher belongs to same school
        role: 'teacher',
        isActive: true
      },
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

    if (!teacher) {
      return NextResponse.json({ 
        error: 'Teacher not found or access denied' 
      }, { status: 404 });
    }

    // Get additional statistics
    const [assignmentCount, gradeCount, studentCount] = await Promise.all([
      // Count assignments created by this teacher
      prisma.assignment.count({
        where: { 
          teacherId: teacher.id,
          schoolId: director.schoolId
        }
      }),
      
      // Count grades given by this teacher
      prisma.grade.count({
        where: { 
          teacherId: teacher.id,
          schoolId: director.schoolId
        }
      }),
      
      // Count unique students taught (from grades)
      prisma.grade.findMany({
        where: { 
          teacherId: teacher.id,
          schoolId: director.schoolId
        },
        select: { studentId: true },
        distinct: ['studentId']
      }).then(grades => grades.length)
    ]);

    // Get recent activity data
    const recentAssignments = await prisma.assignment.findMany({
      where: { 
        teacherId: teacher.id,
        schoolId: director.schoolId
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
        dueDate: true,
        status: true,
        subject: {
          select: { name: true, code: true }
        }
      }
    });

    // Get attendance marking history (last 30 days)
    const attendanceHistory = await prisma.attendance.count({
      where: {
        markedBy: teacher.id,
        schoolId: director.schoolId,
        markedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    // Format teacher data
    const formattedTeacher = {
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      name: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email,
      phone: teacher.phone,
      address: teacher.address,
      avatar: teacher.avatar,
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender,
      isActive: teacher.isActive,
      isEmailVerified: teacher.isEmailVerified,
      lastLogin: teacher.lastLogin,
      createdAt: teacher.createdAt,
      
      // Teacher profile information
      employeeId: teacher.teacherProfile?.employeeId,
      department: teacher.teacherProfile?.department,
      qualification: teacher.teacherProfile?.qualification,
      experienceYears: teacher.teacherProfile?.experienceYears || 0,
      joiningDate: teacher.teacherProfile?.joiningDate,
      coordinatorClass: teacher.teacherProfile?.coordinatorClass,
      
      // Subjects information
      subjects: teacher.teacherProfile?.teacherSubjects?.map(ts => ({
        name: ts.subject.name,
        code: ts.subject.code,
        category: ts.subject.category,
        classes: ts.classes || []
      })) || [],
      
      // Statistics
      statistics: {
        assignmentsCreated: assignmentCount,
        gradesGiven: gradeCount,
        studentsTaught: studentCount,
        attendanceMarked: attendanceHistory,
        totalSubjects: teacher.teacherProfile?.teacherSubjects?.length || 0,
        totalClasses: teacher.teacherProfile?.teacherSubjects?.reduce(
          (total, ts) => total + (ts.classes?.length || 0), 0
        ) || 0
      },
      
      // Recent activity
      recentActivity: {
        assignments: recentAssignments,
        lastAssignmentCreated: recentAssignments[0]?.createdAt || null
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        teacher: formattedTeacher
      }
    });

  } catch (error) {
    console.error('Teacher detail error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Optional: Add PUT method for updating teacher details
export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const teacherId = params.id;
    const updateData = await request.json();

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    // Verify user is a director
    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify teacher exists and belongs to same school
    const existingTeacher = await prisma.user.findUnique({
      where: { 
        id: teacherId,
        schoolId: director.schoolId,
        role: 'teacher'
      }
    });

    if (!existingTeacher) {
      return NextResponse.json({ 
        error: 'Teacher not found or access denied' 
      }, { status: 404 });
    }

    // Separate user data from profile data
    const { 
      firstName, 
      lastName, 
      phone, 
      address, 
      dateOfBirth,
      gender,
      ...profileData 
    } = updateData;

    const userUpdateData = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(gender && { gender })
    };

    const profileUpdateData = {
      ...(profileData.department && { department: profileData.department }),
      ...(profileData.qualification && { qualification: profileData.qualification }),
      ...(profileData.experienceYears !== undefined && { experienceYears: parseInt(profileData.experienceYears) }),
      ...(profileData.joiningDate && { joiningDate: new Date(profileData.joiningDate) }),
      ...(profileData.coordinatorClass && { coordinatorClass: profileData.coordinatorClass })
    };

    // Update user and profile in a transaction
    const updatedTeacher = await prisma.$transaction(async (tx) => {
      // Update user data
      const user = await tx.user.update({
        where: { id: teacherId },
        data: userUpdateData
      });

      // Update or create teacher profile
      const profile = await tx.teacherProfile.upsert({
        where: { userId: teacherId },
        create: {
          userId: teacherId,
          ...profileUpdateData
        },
        update: profileUpdateData
      });

      return { user, profile };
    });

    return NextResponse.json({
      success: true,
      message: 'Teacher updated successfully',
      data: {
        teacher: {
          ...updatedTeacher.user,
          teacherProfile: updatedTeacher.profile
        }
      }
    });

  } catch (error) {
    console.error('Teacher update error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}