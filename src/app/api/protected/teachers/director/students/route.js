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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Verify user is a director
    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { 
        teacherProfile: {
          include: {
            teacherSubjects: { // ✅ Correct field name
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get director's stage from their assigned subjects or default to all senior classes
    let directorStage = 'SS'; // Default to all senior secondary
    
    if (director.teacherProfile?.teacherSubjects?.length > 0) {
      const firstSubject = director.teacherProfile.teacherSubjects[0];
      if (firstSubject.classes && firstSubject.classes.length > 0) {
        // Extract stage from class (e.g., "SS1A" -> "SS1", "SS2B" -> "SS2")
        const classCode = firstSubject.classes[0];
        if (classCode.length >= 3) {
          directorStage = classCode.substring(0, 3); // Gets "SS1", "SS2", etc.
        } else {
          directorStage = classCode.substring(0, 2); // Gets "SS" if format is different
        }
      }
    }

    // Build where clause for students
    let whereClause = {
      schoolId: director.schoolId,
      role: 'student',
      isActive: true,
    };

    // Add class filter if specified
    if (classFilter) {
      whereClause.studentProfile = {
        className: classFilter
      };
    } else {
      // Filter by director's stage (all classes starting with director's stage)
      whereClause.studentProfile = {
        className: {
          startsWith: directorStage
        }
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
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    const totalStudents = await prisma.user.count({ where: whereClause });

    // Get available classes for filtering (only for director's stage)
    const availableClassesQuery = await prisma.user.findMany({
      where: {
        schoolId: director.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            startsWith: directorStage
          }
        }
      },
      select: {
        studentProfile: {
          select: {
            className: true
          }
        }
      }
    });

    // Extract unique class names
    const classes = [...new Set(
      availableClassesQuery
        .map(s => s.studentProfile?.className)
        .filter(Boolean)
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
      
      // Guardian/Parent information
      parentName: student.studentProfile?.parentName,
      parentPhone: student.studentProfile?.parentPhone,
      parentEmail: student.studentProfile?.parentEmail,
      
      // Mock academic data (replace with actual academic records when available)
      currentAverage: Math.floor(Math.random() * 30) + 70, // 70-100%
      attendance: Math.floor(Math.random() * 20) + 80, // 80-100%
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
          availableClasses: classes,
          currentClassFilter: classFilter,
          directorStage
        },
        summary: {
          totalStudents,
          activeStudents: transformedStudents.filter(s => s.isActive).length,
          classCount: classes.length
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