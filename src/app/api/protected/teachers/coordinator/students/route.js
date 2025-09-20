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
          filters: { availableClasses: [], availableArms: [] },
          summary: { totalStudents: 0, classCount: 0 }
        }
      });
    }

    // Build where clause for students
    let whereClause = {
      schoolId: coordinator.schoolId,
      role: 'student',
      isActive: true,
      studentProfile: {
        className: {
          in: coordinatorClasses
        }
      }
    };

    // Apply filters
    if (classFilter) {
      whereClause.studentProfile.className = classFilter;
    }
    if (armFilter) {
      whereClause.studentProfile.className = {
        contains: armFilter
      };
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

    // Get available classes and arms
    const allStudents = await prisma.user.findMany({
      where: {
        schoolId: coordinator.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: coordinatorClasses
          }
        }
      },
      include: { studentProfile: true }
    });

    const availableClasses = [...new Set(
      allStudents.map(s => s.studentProfile?.className).filter(Boolean)
    )].sort();

    const availableArms = [...new Set(
      allStudents.map(s => {
        const className = s.studentProfile?.className;
        if (className && className.includes(' ')) {
          return className.split(' ')[1]; // Get the arm part (silver, diamond, etc.)
        }
        return null;
      }).filter(Boolean)
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

    // Group students by class and arm
    const studentsByClass = {};
    const studentsByArm = {};

    transformedStudents.forEach(student => {
      // Group by class
      if (student.className) {
        if (!studentsByClass[student.className]) {
          studentsByClass[student.className] = [];
        }
        studentsByClass[student.className].push(student);
      }

      // Group by arm
      if (student.arm) {
        if (!studentsByArm[student.arm]) {
          studentsByArm[student.arm] = [];
        }
        studentsByArm[student.arm].push(student);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        students: transformedStudents,
        studentsByClass,
        studentsByArm,
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
          currentClassFilter: classFilter,
          currentArmFilter: armFilter,
          coordinatorClasses
        },
        summary: {
          totalStudents,
          classCount: availableClasses.length,
          armCount: availableArms.length,
          classCounts: Object.entries(studentsByClass).map(([className, students]) => ({
            className,
            count: students.length
          })),
          armCounts: Object.entries(studentsByArm).map(([arm, students]) => ({
            arm,
            count: students.length
          }))
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

// POST - Assign arms to students
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const coordinator = await verifyCoordinatorAccess(token);
    const { studentIds, arm, className } = await request.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Student IDs array is required' 
      }, { status: 400 });
    }

    if (!arm) {
      return NextResponse.json({ 
        error: 'Arm is required (e.g., silver, diamond, mercury, etc.)' 
      }, { status: 400 });
    }

    if (!className) {
      return NextResponse.json({ 
        error: 'Class name is required (e.g., JS1, SS2, etc.)' 
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

    // Check if the base class is in coordinator's classes
    const baseClass = className.split(' ')[0]; // Extract JS1, SS2, etc.
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
          results.failed.push({
            studentId,
            error: 'Student not found or access denied'
          });
          continue;
        }

        // Update student's class with the arm
        await prisma.studentProfile.upsert({
          where: { userId: studentId },
          update: {
            className: fullClassName
          },
          create: {
            userId: studentId,
            className: fullClassName,
            admissionDate: new Date()
          }
        });

        results.successful.push({
          studentId,
          studentName: `${student.firstName} ${student.lastName}`,
          oldClassName: student.studentProfile?.className || 'Unassigned',
          newClassName: fullClassName
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
      message: `Arm assignment completed. ${results.successful.length} students assigned successfully.`,
      data: {
        successful: results.successful,
        failed: results.failed,
        assignedArm: arm,
        className: fullClassName,
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