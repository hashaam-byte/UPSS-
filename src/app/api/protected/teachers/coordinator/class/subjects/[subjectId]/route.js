// API Route: Coordinator - Assign Teacher to Class Subject
// Path: /api/protected/teachers/coordinator/class/subjects/[subjectId]/assign-teacher
// Method: POST
// Access: Coordinator only

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    
    if (!authResult.isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { user } = authResult;
    const { subjectId } = params;

    // Verify coordinator role
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        teacherRole: true,
        schoolId: true,
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
          },
        },
      },
    });

    if (!coordination) {
      return NextResponse.json(
        { success: false, error: 'You are not assigned as a coordinator for any class' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { teacherId } = body;

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'Teacher ID is required' },
        { status: 400 }
      );
    }

    // Verify subject exists and is taught in this class
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: {
        id: true,
        name: true,
        code: true,
        classLevel: true,
        schoolId: true,
      },
    });

    if (!subject || subject.schoolId !== teacherProfile.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if subject is applicable to this class
    if (!subject.classLevel.includes(coordination.class.classLevel)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Subject ${subject.name} is not taught in ${coordination.class.name}`,
          details: {
            subjectLevels: subject.classLevel,
            classLevel: coordination.class.classLevel,
          }
        },
        { status: 400 }
      );
    }

    // Verify teacher is assigned to this subject by admin
    const teacherSubjectAssignment = await prisma.teacherSubject.findFirst({
      where: {
        teacherId: teacherId,
        subjectId: subjectId,
        isActive: true,
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            schoolId: true,
          },
        },
      },
    });

    if (!teacherSubjectAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This teacher is not assigned to teach this subject by admin',
          hint: 'Ask admin to assign this subject to the teacher first'
        },
        { status: 400 }
      );
    }

    if (teacherSubjectAssignment.teacher.schoolId !== teacherProfile.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Teacher does not belong to your school' },
        { status: 403 }
      );
    }

    // Check for existing assignment
    const existingAssignment = await prisma.teacherClassSubjectAssignment.findUnique({
      where: {
        teacherId_classId_subjectId: {
          teacherId: teacherId,
          classId: coordination.class.id,
          subjectId: subjectId,
        },
      },
    });

    if (existingAssignment && existingAssignment.isActive) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'This teacher is already assigned to teach this subject in this class' 
        },
        { status: 409 }
      );
    }

    // Check if another teacher is currently assigned
    const currentAssignment = await prisma.teacherClassSubjectAssignment.findFirst({
      where: {
        classId: coordination.class.id,
        subjectId: subjectId,
        isActive: true,
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Deactivate current assignment if exists
    if (currentAssignment) {
      await prisma.teacherClassSubjectAssignment.update({
        where: { id: currentAssignment.id },
        data: { isActive: false },
      });
    }

    // Create or reactivate assignment
    const assignment = existingAssignment
      ? await prisma.teacherClassSubjectAssignment.update({
          where: { id: existingAssignment.id },
          data: {
            isActive: true,
            assignedBy: user.id,
            assignedAt: new Date(),
          },
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        })
      : await prisma.teacherClassSubjectAssignment.create({
          data: {
            teacherId: teacherId,
            classId: coordination.class.id,
            subjectId: subjectId,
            schoolId: teacherProfile.schoolId,
            assignedBy: user.id,
            isActive: true,
          },
          include: {
            teacher: {
              select: {
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
            subject: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        });

    // Log the action
    await prisma.auditLog.create({
      data: {
        schoolId: teacherProfile.schoolId,
        userId: user.id,
        action: 'CREATE',
        entity: 'TeacherClassSubjectAssignment',
        entityId: assignment.id,
        changes: {
          class: coordination.class.name,
          subject: subject.name,
          teacher: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
          replacedTeacher: currentAssignment
            ? `${currentAssignment.teacher.firstName} ${currentAssignment.teacher.lastName}`
            : null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: currentAssignment
        ? `Successfully replaced teacher for ${subject.name} in ${coordination.class.name}`
        : `Successfully assigned teacher for ${subject.name} in ${coordination.class.name}`,
      data: {
        assignment,
        class: coordination.class,
        previousTeacher: currentAssignment
          ? {
              name: `${currentAssignment.teacher.firstName} ${currentAssignment.teacher.lastName}`,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error assigning teacher to class subject:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to assign teacher',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}