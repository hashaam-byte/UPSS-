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
    const departmentFilter = searchParams.get('department');
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

    // Build where clause for teachers in the same school
    const whereClause = {
      schoolId: director.schoolId,
      role: 'teacher',
      isActive: true,
      NOT: {
        id: director.id // Exclude the director themselves
      },
      teacherProfile: departmentFilter ? {
        department: departmentFilter
      } : {}
    };

    // Get teachers with their profiles and subjects
    const teachers = await prisma.user.findMany({
      where: whereClause,
      include: {
        teacherProfile: {
          include: {
            teacherSubjects: { // Fixed: was 'teachers', now 'teacherSubjects'
              include: {
                subject: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    const totalTeachers = await prisma.user.count({ where: whereClause });

    // Get available departments for filtering
    const availableDepartments = await prisma.user.findMany({
      where: {
        schoolId: director.schoolId,
        role: 'teacher',
        isActive: true,
        teacherProfile: {
          department: {
            not: null
          }
        }
      },
      select: {
        teacherProfile: {
          select: {
            department: true
          }
        }
      }
    });

    const departments = [...new Set(availableDepartments
      .map(t => t.teacherProfile?.department)
      .filter(Boolean)
    )].sort();

    return NextResponse.json({
      success: true,
      data: {
        teachers: teachers.map(teacher => ({
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          avatar: teacher.avatar,
          isActive: teacher.isActive,
          lastLogin: teacher.lastLogin,
          employeeId: teacher.teacherProfile?.employeeId,
          department: teacher.teacherProfile?.department,
          qualification: teacher.teacherProfile?.qualification,
          experienceYears: teacher.teacherProfile?.experienceYears || 0,
          joiningDate: teacher.teacherProfile?.joiningDate,
          subjects: teacher.teacherProfile?.teacherSubjects?.map(ts => ({ // Fixed: was 'teachers', now 'teacherSubjects'
            name: ts.subject.name,
            code: ts.subject.code,
            category: ts.subject.category,
            classes: ts.classes
          })) || []
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTeachers / limit),
          totalTeachers,
          hasNext: page < Math.ceil(totalTeachers / limit),
          hasPrev: page > 1
        },
        filters: {
          availableDepartments: departments
        }
      }
    });

  } catch (error) {
    console.error('Director teachers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}