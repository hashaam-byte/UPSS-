import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get('class');
    const stageFilter = searchParams.get('stage'); // 'JS' or 'SS'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Verify user is a director
    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        teacherProfile: true,
        school: true
      }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Determine director's stage based on their department or default to both
    let directorStages = ['JS', 'SS']; // Default: can see both Junior and Senior Secondary
    
    // If director has a specific stage designation in their department
    if (director.teacherProfile?.department) {
      const dept = director.teacherProfile.department.toLowerCase();
      if (dept.includes('junior') || dept.includes('js')) {
        directorStages = ['JS'];
      } else if (dept.includes('senior') || dept.includes('ss')) {
        directorStages = ['SS'];
      }
      // If department is just 'director', they can see all stages
    }

    // Apply stage filter if provided
    let targetStages = directorStages;
    if (stageFilter && ['JS', 'SS'].includes(stageFilter.toUpperCase())) {
      const requestedStage = stageFilter.toUpperCase();
      // Only allow if director has access to this stage
      if (directorStages.includes(requestedStage)) {
        targetStages = [requestedStage];
      } else {
        return NextResponse.json({ error: 'Access denied to this stage' }, { status: 403 });
      }
    }

    // Build where clause for students - Only include students with assigned classes
    let whereClause = {
      schoolId: director.schoolId, // CRITICAL: Only students from director's school
      role: 'student',
      isActive: true,
      studentProfile: {
        className: {
          not: null,
          notIn: ['', 'Not assigned', null] // Exclude unassigned students
        }
      }
    };

    // Add class filter if specified
    if (classFilter) {
      whereClause.studentProfile.className = classFilter;
    } else {
      // Filter by director's allowed stages
      const stagePatterns = targetStages.map(stage => ({
        className: {
          startsWith: stage
        }
      }));
      
      whereClause.studentProfile = {
        ...whereClause.studentProfile,
        OR: stagePatterns
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

    // Get available classes for filtering (only for director's allowed stages and school)
    const availableClassesQuery = await prisma.studentProfile.findMany({
      where: {
        user: {
          schoolId: director.schoolId, // CRITICAL: Only from director's school
          role: 'student',
          isActive: true
        },
        className: {
          not: null,
          notIn: ['', 'Not assigned', null]
        },
        OR: targetStages.map(stage => ({
          className: {
            startsWith: stage
          }
        }))
      },
      select: {
        className: true
      },
      distinct: ['className']
    });

    // Extract and organize unique class names by stage
    const allClasses = availableClassesQuery
      .map(profile => profile.className)
      .filter(Boolean)
      .sort();

    // Group classes by stage
    const classesByStage = {
      JS: allClasses.filter(className => className.startsWith('JS')),
      SS: allClasses.filter(className => className.startsWith('SS'))
    };

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
      
      // Extract stage from class name
      stage: student.studentProfile?.className?.substring(0, 2), // 'JS' or 'SS'
      level: student.studentProfile?.className?.substring(0, 3), // 'JS1', 'SS2', etc.
      arm: student.studentProfile?.className?.substring(3), // 'A', 'B', etc.
      
      // Parent/Guardian information
      parentName: student.studentProfile?.parentName,
      parentPhone: student.studentProfile?.parentPhone,
      parentEmail: student.studentProfile?.parentEmail,
      
      // Mock academic data (replace with actual academic records when available)
      currentAverage: Math.floor(Math.random() * 30) + 70, // 70-100%
      attendance: Math.floor(Math.random() * 20) + 80, // 80-100%
    }));

    // Group students by stage and level
    const studentsByStage = {
      JS: transformedStudents.filter(s => s.stage === 'JS'),
      SS: transformedStudents.filter(s => s.stage === 'SS')
    };

    const studentsByLevel = {};
    transformedStudents.forEach(student => {
      if (student.level) {
        if (!studentsByLevel[student.level]) {
          studentsByLevel[student.level] = [];
        }
        studentsByLevel[student.level].push(student);
      }
    });

    // Get pending students count (those in import queue)
    const pendingStudents = await prisma.user.count({
      where: {
        schoolId: director.schoolId,
        role: 'student',
        isActive: true,
        OR: [
          {
            studentProfile: {
              className: null
            }
          },
          {
            studentProfile: {
              className: {
                in: ['', 'Not assigned']
              }
            }
          },
          {
            studentProfile: null
          }
        ]
      }
    });

    // Calculate statistics
    const stats = {
      total: totalStudents,
      active: transformedStudents.filter(s => s.isActive).length,
      pending: pendingStudents, // Students waiting for class assignment
      byStage: {
        JS: studentsByStage.JS.length,
        SS: studentsByStage.SS.length
      },
      byLevel: Object.keys(studentsByLevel).reduce((acc, level) => {
        acc[level] = studentsByLevel[level].length;
        return acc;
      }, {}),
      excellentPerformers: transformedStudents.filter(s => s.currentAverage >= 80).length,
      needsAttention: transformedStudents.filter(s => s.currentAverage < 60).length
    };

    return NextResponse.json({
      success: true,
      data: {
        students: transformedStudents,
        studentsByStage,
        studentsByLevel,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStudents / limit),
          totalStudents,
          limit,
          hasNext: page < Math.ceil(totalStudents / limit),
          hasPrev: page > 1
        },
        filters: {
          availableClasses: allClasses,
          classesByStage,
          availableStages: directorStages,
          currentClassFilter: classFilter,
          currentStageFilter: stageFilter,
          directorStages
        },
        summary: {
          totalStudents, // Only assigned students
          activeStudents: stats.active,
          pendingStudents: pendingStudents, // Students in import queue
          classCount: allClasses.length,
          stageCount: directorStages.length,
          statistics: stats
        }
      }
    });

  } catch (error) {
    console.error('Director students error:', error);
    
    // More specific error handling
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (error.code === 'P2025') { // Prisma record not found
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}