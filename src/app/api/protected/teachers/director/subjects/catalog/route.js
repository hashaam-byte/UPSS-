// API Route: /api/protected/teachers/director/subjects/catalog

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const user = await requireAuth(['TEACHER']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const schoolId = user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { success: false, error: 'Teacher is not associated with a school.' },
        { status: 403 }
      );
    }

    // levelSpecialization is also on the profile
    const levelSpecialization = user.profile.levelSpecialization;

    // ── QUERY PARAMS ──────────────────────────────────────────────────────────
    const { searchParams } = new URL(request.url);
    const categoryFilter = searchParams.get('category');
    const isActiveParam  = searchParams.get('isActive');
    const search         = searchParams.get('search');

    // ── LEVEL FILTER ──────────────────────────────────────────────────────────
    const jsLevels = ['JS1', 'JS2', 'JS3'];
    const ssLevels = ['SS1', 'SS2', 'SS3'];

    let classLevelFilter = {};
    if (levelSpecialization === 'JUNIOR') {
      classLevelFilter = { classLevel: { hasSome: jsLevels } };
    } else if (levelSpecialization === 'SENIOR') {
      classLevelFilter = { classLevel: { hasSome: ssLevels } };
    }

    // ── WHERE CLAUSE ──────────────────────────────────────────────────────────
    const whereClause = {
      schoolId,
      isActive: isActiveParam !== null ? isActiveParam === 'true' : true,
      ...classLevelFilter,
      ...(categoryFilter && { category: categoryFilter }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // ── FETCH SUBJECTS ────────────────────────────────────────────────────────
    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        teachers: {
          where: { isActive: true },
          include: {
            teacher: {
              select: {
                id: true,
                employeeId: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        streamMappings: {
          include: {
            stream: {
              select: {
                id: true,
                name: true,
                displayName: true,
              },
            },
          },
        },
        _count: {
          select: {
            teachers: { where: { isActive: true } },
            selectedByStudents: true,
          },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // ── STATS ─────────────────────────────────────────────────────────────────
    const stats = {
      total: subjects.length,
      byCategory: {},
      withTeachers: 0,
      withoutTeachers: 0,
      active: 0,
      inactive: 0,
    };

    subjects.forEach(subject => {
      stats.byCategory[subject.category] = (stats.byCategory[subject.category] || 0) + 1;
      subject._count.teachers > 0 ? stats.withTeachers++ : stats.withoutTeachers++;
      subject.isActive ? stats.active++ : stats.inactive++;
    });

    // include legacy `byType` key for frontend compatibility
    stats.byType = { ...stats.byCategory }; // subjects are typed by their category


    // ── FORMAT ────────────────────────────────────────────────────────────────
    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      category: subject.category,
      classLevel: subject.classLevel,
      eligibleStreams: subject.eligibleStreams || [],
      isElectiveOption: subject.isElectiveOption,
      electiveGroup: subject.electiveGroup,
      maxStudents: subject.maxStudents,
      creditHours: subject.creditHours,
      isActive: subject.isActive,
      assignedTeachers: subject.teachers.map(ts => ({
        teacherSubjectId: ts.id,
        teacherId: ts.teacher.id,
        name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
        employeeId: ts.teacher.employeeId,
      })),

      streamMappings: subject.streamMappings.map(sm => ({
        streamId: sm.stream.id,
        streamName: sm.stream.name,
        displayName: sm.stream.displayName,
        isCore: sm.isCore,
        isElective: sm.isElective,
        electiveGroup: sm.electiveGroup,
      })),
      coverage: {
        teacherCount: subject._count.teachers,
        studentEnrollment: subject._count.selectedByStudents,
      },
    }));

    return NextResponse.json({
      success: true,
      subjects: formattedSubjects,
      stats,
      directorInfo: {
        name: `${user.firstName} ${user.lastName}`,
        level: levelSpecialization,
        canManage: levelSpecialization === 'JUNIOR'
          ? 'JS1-JS3'
          : levelSpecialization === 'SENIOR'
          ? 'SS1-SS3'
          : 'All levels',
      },
    });

  } catch (error) {
    console.error('Error fetching subjects catalog:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects.', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
