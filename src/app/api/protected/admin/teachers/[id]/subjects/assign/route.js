// API Route: /api/protected/admin/subjects/teacher-assignments
// Methods: GET | POST

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: authenticate and verify admin
// ─────────────────────────────────────────────────────────────────────────────
async function resolveAdmin() {
  // requireAuth throws on failure, returns user object on success
  let user;
  try {
    user = await requireAuth();
  } catch {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  // UserRole must be ADMIN or HEADADMIN
  if (!['ADMIN', 'HEADADMIN'].includes(user.role)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Access denied. Admin role required.' },
        { status: 403 }
      ),
    };
  }

  if (!user.schoolId) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Admin is not associated with a school.' },
        { status: 403 }
      ),
    };
  }

  return { user, schoolId: user.schoolId };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — fetch SUBJECT_TEACHER teachers + subjects with assignment state
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const resolved = await resolveAdmin();
    if (resolved.error) return resolved.error;
    const { schoolId } = resolved;

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'all';

    // ── TEACHERS ─────────────────────────────────────────────────────────────
    const teachers = await prisma.teacherProfile.findMany({
      where: {
        isActive: true,
        teacherRole: 'SUBJECT_TEACHER',
        user: { schoolId, isActive: true },
      },
      include: {
        user: {
          select: { id: true, email: true, isActive: true },
        },
        teacherSubjects: {
          where: { isActive: true },
          include: {
            subject: {
              select: {
                id: true, name: true, code: true,
                category: true, classLevel: true,
              },
            },
          },
        },
        teacherClassCoordinators: {
          select: {
            classId: true,
            class: { select: { id: true, name: true, classLevel: true } },
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    // ── SUBJECTS ─────────────────────────────────────────────────────────────
    const subjects = await prisma.subject.findMany({
      where: { schoolId, isActive: true },
      include: {
        teachers: {
          where: { isActive: true },
          include: {
            teacher: {
              select: {
                id: true, firstName: true, lastName: true,
                employeeId: true, teacherRole: true,
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

    // ── FORMAT TEACHERS ───────────────────────────────────────────────────────
    const formattedTeachers = teachers.map(teacher => {
      const uniqueClasses = new Set(teacher.teacherClassCoordinators.map(c => c.classId)).size;
      const subjectCount  = teacher.teacherSubjects.length;
      return {
        id: teacher.id,
        userId: teacher.userId,
        employeeId: teacher.employeeId,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        fullName: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.user.email,
        department: teacher.department,
        teacherRole: teacher.teacherRole,
        levelSpecialization: teacher.levelSpecialization,
        canTeachStreams: teacher.canTeachStreams || [],
        experienceYears: teacher.experienceYears,
        isActive: teacher.user.isActive,
        assignments: {
          totalSubjects: subjectCount,
          subjects: teacher.teacherSubjects.map(ts => ({
            id: ts.subject.id,
            name: ts.subject.name,
            code: ts.subject.code,
            category: ts.subject.category,
            classLevel: ts.subject.classLevel,
            assignedAt: ts.assignedAt,
          })),
          uniqueClasses,
        },
        workload: {
          subjectCount,
          classCount: uniqueClasses,
          status:
            subjectCount === 0 ? 'unassigned' :
            subjectCount > 5   ? 'heavy'      :
            subjectCount > 3   ? 'moderate'   : 'light',
        },
      };
    });

    // ── FORMAT SUBJECTS ───────────────────────────────────────────────────────
    const formattedSubjects = subjects.map(subject => {
      const teacherCount    = subject._count.teachers;
      const enrollmentCount = subject._count.selectedByStudents;
      const coverageStatus  =
        teacherCount === 0 ? 'critical' :
        teacherCount === 1 ? 'minimal'  :
        (enrollmentCount > 0 && teacherCount < Math.ceil(enrollmentCount / 40))
          ? 'understaffed' : 'good';
      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        category: subject.category,
        classLevel: subject.classLevel,
        eligibleStreams: subject.eligibleStreams || [],
        isElectiveOption: subject.isElectiveOption,
        electiveGroup: subject.electiveGroup,
        maxStudents: subject.maxStudents,
        assignedTeachers: subject.teachers.map(t => ({
          teacherSubjectId: t.id,
          teacherId: t.teacher.id,
          name: `${t.teacher.firstName} ${t.teacher.lastName}`,
          employeeId: t.teacher.employeeId,
          teacherRole: t.teacher.teacherRole,
        })),
        coverage: {
          teacherCount,
          enrollmentCount,
          status: coverageStatus,
          ratio: teacherCount > 0 ? Math.ceil(enrollmentCount / teacherCount) : 0,
        },
      };
    });

    // ── STATS ─────────────────────────────────────────────────────────────────
    const stats = {
      totalTeachers: formattedTeachers.length,
      teachersWithAssignments:    formattedTeachers.filter(t => t.assignments.totalSubjects > 0).length,
      teachersWithoutAssignments: formattedTeachers.filter(t => t.assignments.totalSubjects === 0).length,
      totalSubjects:          formattedSubjects.length,
      subjectsWithTeachers:   formattedSubjects.filter(s => s.coverage.teacherCount > 0).length,
      subjectsWithoutTeachers:formattedSubjects.filter(s => s.coverage.teacherCount === 0).length,
      criticalSubjects:       formattedSubjects.filter(s => s.coverage.status === 'critical').length,
      averageSubjectsPerTeacher: formattedTeachers.length > 0
        ? (formattedTeachers.reduce((sum, t) => sum + t.assignments.totalSubjects, 0) / formattedTeachers.length).toFixed(1)
        : '0.0',
      averageTeachersPerSubject: formattedSubjects.length > 0
        ? (formattedSubjects.reduce((sum, s) => sum + s.coverage.teacherCount, 0) / formattedSubjects.length).toFixed(1)
        : '0.0',
    };

    // ── VIEW FILTER ───────────────────────────────────────────────────────────
    let filteredData = {};
    switch (view) {
      case 'unassigned':
        filteredData = {
          teachers: formattedTeachers.filter(t => t.assignments.totalSubjects === 0),
          subjects: formattedSubjects.filter(s => s.coverage.teacherCount === 0),
        };
        break;
      case 'coverage':
        filteredData = {
          subjects: [...formattedSubjects].sort((a, b) => {
            const order = { critical: 0, minimal: 1, understaffed: 2, good: 3 };
            return order[a.coverage.status] - order[b.coverage.status];
          }),
        };
        break;
      default:
        filteredData = { teachers: formattedTeachers, subjects: formattedSubjects };
    }

    // ── RECENT ACTIVITY ───────────────────────────────────────────────────────
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        resource: 'TeacherSubject',
        action: { in: ['CREATE', 'DELETE'] },
        user: { schoolId },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, action: true, description: true,
        metadata: true, createdAt: true,
        user: { select: { email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: { stats, ...filteredData, recentActivity },
    });

  } catch (error) {
    console.error('GET /teacher-assignments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch teacher assignments.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — assign or unassign a teacher from a subject
// Body: { action: "assign"|"unassign", teacherId: string, subjectId: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const resolved = await resolveAdmin();
    if (resolved.error) return resolved.error;
    const { user, schoolId } = resolved;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body.' },
        { status: 400 }
      );
    }

    const { action, teacherId, subjectId } = body;

    if (!action || !['assign', 'unassign'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'action must be "assign" or "unassign".' },
        { status: 400 }
      );
    }
    if (!teacherId || !subjectId) {
      return NextResponse.json(
        { success: false, error: 'teacherId and subjectId are required.' },
        { status: 400 }
      );
    }

    // Verify teacher belongs to this school and is SUBJECT_TEACHER
    const teacher = await prisma.teacherProfile.findFirst({
      where: {
        id: teacherId,
        isActive: true,
        teacherRole: 'SUBJECT_TEACHER',
        user: { schoolId, isActive: true },
      },
      select: { id: true, firstName: true, lastName: true, employeeId: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found, inactive, or does not belong to your school.' },
        { status: 404 }
      );
    }

    // Verify subject belongs to this school
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, schoolId, isActive: true },
      select: { id: true, name: true, code: true, category: true, classLevel: true },
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found or does not belong to your school.' },
        { status: 404 }
      );
    }

    const teacherName = `${teacher.firstName} ${teacher.lastName}`;

    // ── ASSIGN ────────────────────────────────────────────────────────────────
    if (action === 'assign') {
      const existing = await prisma.teacherSubject.findUnique({
        where: { teacherId_subjectId: { teacherId, subjectId } },
      });

      if (existing?.isActive) {
        return NextResponse.json(
          { success: false, error: 'This teacher is already assigned to this subject.' },
          { status: 409 }
        );
      }

      const assignment = await prisma.teacherSubject.upsert({
        where: { teacherId_subjectId: { teacherId, subjectId } },
        create: { teacherId, subjectId, assignedBy: user.id, assignedAt: new Date(), isActive: true, classes: [] },
        update: { isActive: true, assignedAt: new Date(), assignedBy: user.id },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          resource: 'TeacherSubject',
          resourceId: assignment.id,
          description: `Assigned ${teacherName} to ${subject.name}`,
          metadata: { teacherId, subjectId },
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: `${teacherName} has been assigned to ${subject.name}.`,
          data: {
            teacherSubjectId: assignment.id,
            teacher: { id: teacher.id, name: teacherName, employeeId: teacher.employeeId },
            subject,
            assignedAt: assignment.assignedAt,
          },
        },
        { status: 201 }
      );
    }

    // ── UNASSIGN ──────────────────────────────────────────────────────────────
    if (action === 'unassign') {
      const existing = await prisma.teacherSubject.findUnique({
        where: { teacherId_subjectId: { teacherId, subjectId } },
      });

      if (!existing || !existing.isActive) {
        return NextResponse.json(
          { success: false, error: 'No active assignment found for this teacher and subject.' },
          { status: 404 }
        );
      }

      await prisma.teacherSubject.update({
        where: { teacherId_subjectId: { teacherId, subjectId } },
        data: { isActive: false },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resource: 'TeacherSubject',
          resourceId: existing.id,
          description: `Unassigned ${teacherName} from ${subject.name}`,
          metadata: { teacherId, subjectId },
        },
      });

      return NextResponse.json({
        success: true,
        message: `${teacherName} has been unassigned from ${subject.name}.`,
        data: { teacherId, subjectId },
      });
    }

  } catch (error) {
    console.error('POST /teacher-assignments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process teacher assignment.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}