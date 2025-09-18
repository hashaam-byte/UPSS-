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
      include: { teacherProfile: true }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const directorStage = director.teacherProfile.subjects[0];

    // Build where clause
    const whereClause = {
      schoolId: director.schoolId,
      role: 'student',
      isActive: true,
      studentProfile: {
        className: classFilter ? classFilter : {
          startsWith: directorStage
        }
      }
    };

    // Get students with pagination
    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        studentProfile: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        firstName: 'asc'
      }
    });

    const totalStudents = await prisma.user.count({ where: whereClause });

    // Get available classes for filtering
    const availableClasses = await prisma.user.findMany({
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
      },
      distinct: ['studentProfile.className']
    });

    const classes = [...new Set(availableClasses.map(s => s.studentProfile?.className).filter(Boolean))];

    return NextResponse.json({
      success: true,
      data: {
        students: students.map(student => ({
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          email: student.email,
          studentId: student.studentProfile?.studentId,
          className: student.studentProfile?.className,
          section: student.studentProfile?.section,
          admissionDate: student.studentProfile?.admissionDate,
          avatar: student.avatar,
          isActive: student.isActive,
          lastLogin: student.lastLogin
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalStudents / limit),
          totalStudents,
          hasNext: page < Math.ceil(totalStudents / limit),
          hasPrev: page > 1
        },
        filters: {
          availableClasses: classes
        }
      }
    });

  } catch (error) {
    console.error('Director students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
