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

    // Verify user is a director
    const director = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });

    if (!director || director.role !== 'teacher' || director.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const directorStage = director.teacherProfile.subjects[0];

    // Get teachers in director's stage
    const teachers = await prisma.user.findMany({
      where: {
        schoolId: director.schoolId,
        role: 'teacher',
        isActive: true,
        teacherProfile: {
          subjects: {
            hasSome: [directorStage]
          }
        }
      },
      include: {
        teacherProfile: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        teachers: teachers.map(teacher => ({
          id: teacher.id,
          name: `${teacher.firstName} ${teacher.lastName}`,
          email: teacher.email,
          employeeId: teacher.teacherProfile?.employeeId,
          department: teacher.teacherProfile?.department,
          subjects: teacher.teacherProfile?.subjects || [],
          qualification: teacher.teacherProfile?.qualification,
          experienceYears: teacher.teacherProfile?.experienceYears,
          joiningDate: teacher.teacherProfile?.joiningDate,
          avatar: teacher.avatar,
          isActive: teacher.isActive,
          lastLogin: teacher.lastLogin
        }))
      }
    });

  } catch (error) {
    console.error('Director teachers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
