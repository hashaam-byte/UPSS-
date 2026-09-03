// API Route: /api/protected/teachers/director/subjects/[id]/route.js
// Update or Delete a subject (Director only)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// UPDATE subject
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: authResult.userId },
      select: {
        id: true,
        schoolId: true,
        teacherRole: true,
        levelSpecialization: true,
      },
    });

    if (!teacher || teacher.teacherRole !== 'DIRECTOR') {
      return NextResponse.json(
        { success: false, error: 'Only Directors can update subjects' },
        { status: 403 }
      );
    }

    // Get existing subject
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            selectedByStudents: true,
          },
        },
      },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Verify subject belongs to director's school
    if (existingSubject.schoolId !== teacher.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify subjects from another school' },
        { status: 403 }
      );
    }

    // Verify director can modify this subject (level check)
    const jsLevels = ['JS1', 'JS2', 'JS3'];
    const ssLevels = ['SS1', 'SS2', 'SS3'];
    
    const hasJSLevels = existingSubject.classLevel.some(level => jsLevels.includes(level));
    const hasSSLevels = existingSubject.classLevel.some(level => ssLevels.includes(level));

    if (teacher.levelSpecialization === 'JUNIOR' && hasSSLevels) {
      return NextResponse.json(
        { success: false, error: 'JS Director cannot modify SS subjects' },
        { status: 403 }
      );
    }

    if (teacher.levelSpecialization === 'SENIOR' && hasJSLevels) {
      return NextResponse.json(
        { success: false, error: 'SS Director cannot modify JS subjects' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      description,
      subjectType,
      classLevel,
      eligibleStreams,
      isElectiveOption,
      electiveGroup,
      maxStudents,
      creditHours,
      isActive,
    } = body;

    // Prevent changing code if subject has student selections
    if (body.code && body.code !== existingSubject.code && existingSubject._count.selectedByStudents > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot change subject code - subject has student selections',
        },
        { status: 400 }
      );
    }

    // Validate class level changes
    if (classLevel && classLevel.length > 0) {
      const newHasJS = classLevel.some(level => jsLevels.includes(level));
      const newHasSS = classLevel.some(level => ssLevels.includes(level));

      if (teacher.levelSpecialization === 'JUNIOR' && newHasSS) {
        return NextResponse.json(
          { success: false, error: 'JS Director cannot assign SS levels' },
          { status: 400 }
        );
      }

      if (teacher.levelSpecialization === 'SENIOR' && newHasJS) {
        return NextResponse.json(
          { success: false, error: 'SS Director cannot assign JS levels' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData = {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(subjectType && { subjectType }),
      ...(classLevel && classLevel.length > 0 && { classLevel }),
      ...(eligibleStreams !== undefined && { eligibleStreams }),
      ...(isElectiveOption !== undefined && { isElectiveOption }),
      ...(electiveGroup !== undefined && { electiveGroup }),
      ...(maxStudents !== undefined && { maxStudents }),
      ...(creditHours !== undefined && { creditHours }),
      ...(isActive !== undefined && { isActive }),
    };

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
      include: {
        teachers: {
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        streamMappings: {
          include: {
            stream: true,
          },
        },
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        schoolId: teacher.schoolId,
        userId: authResult.userId,
        action: 'UPDATE',
        entity: 'Subject',
        entityId: id,
        changes: updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      subject: updatedSubject,
    });

  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update subject',
        details: error.message,
      },
      { status: 500 }
    );
}
}

// DELETE subject
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get teacher profile
    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: authResult.userId },
      select: {
        id: true,
        schoolId: true,
        teacherRole: true,
        levelSpecialization: true,
      },
    });

    if (!teacher || teacher.teacherRole !== 'DIRECTOR') {
      return NextResponse.json(
        { success: false, error: 'Only Directors can delete subjects' },
        { status: 403 }
      );
    }

    // Get existing subject
    const existingSubject = await prisma.subject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            selectedByStudents: true,
            teachers: true,
            assignments: true,
            tests: true,
            grades: true,
          },
        },
      },
    });

    if (!existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (existingSubject.schoolId !== teacher.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete subjects from another school' },
        { status: 403 }
      );
    }

    // Check if subject has any dependencies
    const hasDependencies =
      existingSubject._count.selectedByStudents > 0 ||
      existingSubject._count.assignments > 0 ||
      existingSubject._count.tests > 0 ||
      existingSubject._count.grades > 0;

    if (hasDependencies) {
      // Instead of deleting, deactivate
      const deactivated = await prisma.subject.update({
        where: { id },
        data: { isActive: false },
      });

      await prisma.auditLog.create({
        data: {
          schoolId: teacher.schoolId,
          userId: authResult.userId,
          action: 'DELETE',
          entity: 'Subject',
          entityId: id,
          changes: {
            note: 'Deactivated instead of deleted due to existing data',
            dependencies: existingSubject._count,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Subject has existing data and has been deactivated instead of deleted',
        subject: deactivated,
        wasDeactivated: true,
      });
    }

    // Safe to delete
    await prisma.subject.delete({
      where: { id },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        schoolId: teacher.schoolId,
        userId: authResult.userId,
        action: 'DELETE',
        entity: 'Subject',
        entityId: id,
        changes: {
          name: existingSubject.name,
          code: existingSubject.code,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully',
      wasDeactivated: false,
    });

  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete subject',
        details: error.message,
      },
      { status: 500 }
    );
}
}
