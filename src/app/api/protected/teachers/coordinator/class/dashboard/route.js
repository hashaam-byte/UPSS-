// API Route: Coordinator - Get Class Dashboard Data
// Path: /api/protected/teachers/coordinator/class/dashboard
// Method: GET
// Access: Coordinator only

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // Verify coordinator role
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        teacherRole: true,
        schoolId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!teacherProfile || teacherProfile.teacherRole !== 'COORDINATOR') {
      return NextResponse.json(
        { success: false, error: 'Access denied. Coordinator role required.' },
        { status: 403 }
      );
    }

    // Get coordinator's assigned class
    const coordination = await prisma.teacherClassCoordinator.findFirst({
      where: {
        teacherId: teacherProfile.id,
        isActive: true,
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            classLevel: true,
            section: true,
            streamType: true,
            capacity: true,
          },
        },
      },
    });

    if (!coordination) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You are not assigned as a coordinator for any class',
          hint: 'Contact admin to assign you to a class'
        },
        { status: 403 }
      );
    }

    const classInfo = coordination.class;

    // Get students in this class
    const students = await prisma.studentProfile.findMany({
      where: {
        classId: classInfo.id,
        isActive: true,
      },
      include: {
        subjectSelection: {
          include: {
            subjects: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    subjectType: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        lastName: 'asc',
      },
    });

    // Calculate stream distribution
    const streamDistribution = {};
    students.forEach(student => {
      if (student.subjectSelection?.stream) {
        const stream = student.subjectSelection.stream;
        streamDistribution[stream] = (streamDistribution[stream] || 0) + 1;
      }
    });

    const streamStats = Object.entries(streamDistribution).map(([stream, count]) => ({
      stream,
      count,
      percentage: ((count / students.length) * 100).toFixed(1),
    }));

    // Get subjects for this class level
    const classSubjects = await prisma.subject.findMany({
      where: {
        schoolId: teacherProfile.schoolId,
        classLevel: {
          has: classInfo.classLevel,
        },
        isActive: true,
      },
      include: {
        teachers: {
          where: {
            isActive: true,
          },
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
        classAssignments: {
          where: {
            classId: classInfo.id,
            isActive: true,
          },
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
          },
        },
        _count: {
          select: {
            selectedByStudents: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format subject assignments
    const subjectAssignments = classSubjects.map(subject => {
      const classAssignment = subject.classAssignments[0]; // Should only be one per class
      const availableTeachers = subject.teachers.map(ts => ({
        id: ts.teacher.id,
        name: `${ts.teacher.firstName} ${ts.teacher.lastName}`,
        employeeId: ts.teacher.employeeId,
      }));

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        subjectType: subject.subjectType,
        enrollmentCount: subject._count.selectedByStudents,
        assignedTeacher: classAssignment
          ? {
              id: classAssignment.teacher.id,
              name: `${classAssignment.teacher.firstName} ${classAssignment.teacher.lastName}`,
              employeeId: classAssignment.teacher.employeeId,
            }
          : null,
        availableTeachers,
        needsAssignment: !classAssignment && availableTeachers.length > 0,
        noTeachersAvailable: availableTeachers.length === 0,
      };
    });

    // Calculate stats
    const stats = {
      totalStudents: students.length,
      studentsWithSelections: students.filter(s => s.subjectSelection?.selectionComplete).length,
      studentsWithoutSelections: students.filter(s => !s.subjectSelection?.selectionComplete).length,
      totalSubjects: classSubjects.length,
      subjectsAssigned: subjectAssignments.filter(s => s.assignedTeacher).length,
      subjectsNeedingTeacher: subjectAssignments.filter(s => s.needsAssignment).length,
      subjectsWithNoTeachers: subjectAssignments.filter(s => s.noTeachersAvailable).length,
    };

    // Get pending selection students
    const pendingSelections = students
      .filter(s => !s.subjectSelection || !s.subjectSelection.selectionComplete)
      .map(s => ({
        studentId: s.id,
        studentName: `${s.firstName} ${s.lastName}`,
        studentIdNumber: s.studentId,
        hasStarted: !!s.subjectSelection,
        isLocked: s.subjectSelection?.isLocked || false,
      }));

    return NextResponse.json({
      success: true,
      data: {
        coordinator: {
          name: `${teacherProfile.firstName} ${teacherProfile.lastName}`,
        },
        class: classInfo,
        stats,
        streamDistribution: streamStats,
        students: students.map(s => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          studentId: s.studentId,
          stream: s.subjectSelection?.stream || null,
          selectionComplete: s.subjectSelection?.selectionComplete || false,
          selectionLocked: s.subjectSelection?.isLocked || false,
          subjectCount: s.subjectSelection?.subjects.length || 0,
        })),
        subjectAssignments,
        pendingSelections,
      },
    });
  } catch (error) {
    console.error('Error fetching coordinator dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard data',
        details: error.message 
      },
      { status: 500 }
    );
}
}