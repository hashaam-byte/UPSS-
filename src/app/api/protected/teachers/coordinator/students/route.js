import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify coordinator access
async function verifyCoordinatorAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { teacherProfile: true, school: true }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'coordinator') {
    throw new Error('Access denied');
  }

  return user;
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const coordinator = await verifyCoordinatorAccess(token);
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get('class');
    const armFilter = searchParams.get('arm');
    const departmentFilter = searchParams.get('department');
    const assignedFilter = searchParams.get('assigned'); // 'true', 'false', or null
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get coordinator's assigned classes from TeacherSubjects
    const coordinatorSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacher: {
          user: {
            id: coordinator.id
          }
        }
      },
      include: {
        subject: true
      }
    });

    const coordinatorClasses = [...new Set(
      coordinatorSubjects.flatMap(ts => ts.classes)
    )];

    if (coordinatorClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          pagination: { currentPage: 1, totalPages: 0, totalStudents: 0 },
          filters: { availableClasses: [], availableArms: [], availableDepartments: [] },
          summary: { totalStudents: 0, classCount: 0, assignedCount: 0, unassignedCount: 0 }
        }
      });
    }

    // Build where clause for students
    let whereClause = {
      schoolId: coordinator.schoolId,
      role: 'student',
      isActive: true,
      studentProfile: {
        className: assignedFilter === 'false' 
          ? null  // Show unassigned students
          : assignedFilter === 'true' 
          ? { not: null }  // Show assigned students
          : undefined  // Show all students
      }
    };

    // If showing assigned students or all students, filter by coordinator classes
    if (assignedFilter !== 'false') {
      if (!whereClause.studentProfile) whereClause.studentProfile = {};
      whereClause.studentProfile.className = {
        in: coordinatorClasses
      };
    }

    // Apply additional filters
    if (classFilter && assignedFilter !== 'false') {
      whereClause.studentProfile.className = classFilter;
    }
    if (armFilter && assignedFilter !== 'false') {
      if (whereClause.studentProfile.className) {
        whereClause.studentProfile.className = {
          contains: armFilter
        };
      }
    }
    if (departmentFilter) {
      if (!whereClause.studentProfile) whereClause.studentProfile = {};
      whereClause.studentProfile.department = departmentFilter;
    }

    // Get students with pagination
    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        studentProfile: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { 
          studentProfile: {
            className: 'asc'
          }
        },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    const totalStudents = await prisma.user.count({ where: whereClause });

    // Get available classes, arms, and departments for filters
    const allStudents = await prisma.user.findMany({
      where: {
        schoolId: coordinator.schoolId,
        role: 'student',
        isActive: true
      },
      include: { studentProfile: true }
    });

    const assignedStudents = allStudents.filter(s => s.studentProfile?.className);
    const unassignedStudents = allStudents.filter(s => !s.studentProfile?.className);

    const availableClasses = [...new Set(
      assignedStudents.map(s => s.studentProfile?.className).filter(Boolean)
    )].sort();

    const availableArms = [...new Set(
      assignedStudents.map(s => {
        const className = s.studentProfile?.className;
        if (className && className.includes(' ')) {
          return className.split(' ')[1]; // Get the arm part (silver, diamond, etc.)
        }
        return null;
      }).filter(Boolean)
    )].sort();

    const availableDepartments = [...new Set(
      allStudents.map(s => s.studentProfile?.department).filter(Boolean)
    )].sort();

    // Transform student data
    const transformedStudents = students.map(student => ({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      email: student.email,
      phone: student.phone,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      avatar: student.avatar,
      isActive: student.isActive,
      lastLogin: student.lastLogin,
      
      // Student profile data
      studentId: student.studentProfile?.studentId,
      className: student.studentProfile?.className,
      section: student.studentProfile?.section,
      department: student.studentProfile?.department,
      admissionDate: student.studentProfile?.admissionDate,
      
      // Extract stage, level, and arm from class name
      stage: student.studentProfile?.className?.substring(0, 2), // 'JS' or 'SS'
      level: student.studentProfile?.className?.substring(0, 3), // 'JS1', 'SS2', etc.
      arm: student.studentProfile?.className?.includes(' ') 
        ? student.studentProfile.className.split(' ')[1] 
        : null, // 'silver', 'diamond', etc.
      
      // Parent/Guardian information
      parentName: student.studentProfile?.parentName,
      parentPhone: student.studentProfile?.parentPhone,
      parentEmail: student.studentProfile?.parentEmail,
    }));

    return NextResponse.json({
      success: true,
      data: {
        students: transformedStudents,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStudents / limit),
          totalStudents,
          limit,
          hasNext: page < Math.ceil(totalStudents / limit),
          hasPrev: page > 1
        },
        filters: {
          availableClasses,
          availableArms,
          availableDepartments,
          currentClassFilter: classFilter,
          currentArmFilter: armFilter,
          currentDepartmentFilter: departmentFilter,
          currentAssignedFilter: assignedFilter,
          coordinatorClasses
        },
        summary: {
          totalStudents: allStudents.length,
          assignedCount: assignedStudents.length,
          unassignedCount: unassignedStudents.length,
          classCount: availableClasses.length,
          armCount: availableArms.length,
          departmentCount: availableDepartments.length
        }
      }
    });

  } catch (error) {
    console.error('Coordinator students error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

// POST - Assign arms and departments to students
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const coordinator = await verifyCoordinatorAccess(token);
    const { studentIds, arm, className, department } = await request.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Student IDs array is required' 
      }, { status: 400 });
    }

    if (!arm || !className) {
      return NextResponse.json({ 
        error: 'Both arm and class name are required' 
      }, { status: 400 });
    }

    // Verify coordinator has access to this class
    const coordinatorSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacher: {
          user: {
            id: coordinator.id
          }
        }
      }
    });

    const coordinatorClasses = [...new Set(
      coordinatorSubjects.flatMap(ts => ts.classes)
    )];

    const baseClass = className.split(' ')[0];
    if (!coordinatorClasses.some(cls => cls.startsWith(baseClass))) {
      return NextResponse.json({ 
        error: 'You do not have access to assign arms to this class' 
      }, { status: 403 });
    }

    // Construct full class name with arm
    const fullClassName = `${baseClass} ${arm}`;

    const results = {
      successful: [],
      failed: []
    };

    // Process each student
    for (const studentId of studentIds) {
      try {
        const student = await prisma.user.findFirst({
          where: {
            id: studentId,
            schoolId: coordinator.schoolId,
            role: 'student',
            isActive: true
          },
          include: {
            studentProfile: true
          }
        });

        if (!student) {
          results.failed.push({
            studentId,
            error: 'Student not found or access denied'
          });
          continue;
        }

        // Update student's class and department
        const updateData = {
          className: fullClassName
        };

        // Only add department for SS students if provided
        if (department && baseClass.startsWith('SS')) {
          updateData.department = department;
        }

        await prisma.studentProfile.upsert({
          where: { userId: studentId },
          update: updateData,
          create: {
            userId: studentId,
            className: fullClassName,
            department: (department && baseClass.startsWith('SS')) ? department : null,
            admissionDate: new Date()
          }
        });

        results.successful.push({
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          oldClassName: student.studentProfile?.className || 'Unassigned',
          newClassName: fullClassName,
          department: (department && baseClass.startsWith('SS')) ? department : null
        });

      } catch (error) {
        results.failed.push({
          studentId,
          error: error.message || 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assignment completed. ${results.successful.length} students assigned successfully.`,
      data: {
        successful: results.successful,
        failed: results.failed,
        assignedArm: arm,
        className: fullClassName,
        department: department,
        totalProcessed: studentIds.length
      }
    });

  } catch (error) {
    console.error('Assign arms error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// PUT - Edit student assignments
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const coordinator = await verifyCoordinatorAccess(token);
    const { studentId, className, department } = await request.json();

    if (!studentId || !className) {
      return NextResponse.json({ 
        error: 'Student ID and class name are required' 
      }, { status: 400 });
    }

    // Verify student exists and belongs to coordinator's school
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: coordinator.schoolId,
        role: 'student',
        isActive: true
      },
      include: {
        studentProfile: true
      }
    });

    if (!student) {
      return NextResponse.json({ 
        error: 'Student not found or access denied' 
      }, { status: 404 });
    }

    // Update student's assignment
    const updateData = { className };
    const baseClass = className.split(' ')[0];
    
    // Handle department for SS students
    if (baseClass.startsWith('SS')) {
      updateData.department = department || null;
    } else {
      updateData.department = null; // Clear department for non-SS students
    }

    await prisma.studentProfile.upsert({
      where: { userId: studentId },
      update: updateData,
      create: {
        userId: studentId,
        className: className,
        department: updateData.department,
        admissionDate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Student assignment updated successfully',
      data: {
        studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        oldClassName: student.studentProfile?.className,
        newClassName: className,
        oldDepartment: student.studentProfile?.department,
        newDepartment: updateData.department
      }
    });

  } catch (error) {
    console.error('Edit student assignment error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}