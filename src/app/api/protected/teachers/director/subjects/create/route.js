// API Route: /api/protected/teachers/director/subjects/create
// Create a new subject (Director only)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Verify authentication and role
    const authResult = await verifyAuth(request);
    
    if (!authResult.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is a Director
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
        { success: false, error: 'Only Directors can create subjects' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      code,
      description,
      subjectType,
      classLevel,
      eligibleStreams,
      isElectiveOption,
      electiveGroup,
      maxStudents,
      creditHours,
    } = body;

    // Validation
    if (!name || !code || !subjectType || !classLevel || classLevel.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, code, subjectType, classLevel',
        },
        { status: 400 }
      );
    }

    // Validate that director can only create subjects for their level
    const isJSDirector = teacher.levelSpecialization === 'JUNIOR';
    const isSSDirector = teacher.levelSpecialization === 'SENIOR';
    
    const jsLevels = ['JS1', 'JS2', 'JS3'];
    const ssLevels = ['SS1', 'SS2', 'SS3'];
    
    const hasJSLevels = classLevel.some(level => jsLevels.includes(level));
    const hasSSLevels = classLevel.some(level => ssLevels.includes(level));

    if (isJSDirector && hasSSLevels) {
      return NextResponse.json(
        {
          success: false,
          error: 'JS Director can only create subjects for Junior Secondary (JS1-JS3)',
        },
        { status: 403 }
      );
    }

    if (isSSDirector && hasJSLevels) {
      return NextResponse.json(
        {
          success: false,
          error: 'SS Director can only create subjects for Senior Secondary (SS1-SS3)',
        },
        { status: 403 }
      );
    }

    // Check if subject code already exists in this school
    const existingSubject = await prisma.subject.findUnique({
      where: {
        schoolId_code: {
          schoolId: teacher.schoolId,
          code: code,
        },
      },
    });

    if (existingSubject) {
      return NextResponse.json(
        {
          success: false,
          error: `Subject with code "${code}" already exists`,
        },
        { status: 400 }
      );
    }

    // Validate eligible streams for SS subjects
    if (hasSSLevels && eligibleStreams && eligibleStreams.length > 0) {
      const validStreams = ['SCIENCE', 'ARTS', 'COMMERCIAL'];
      const invalidStreams = eligibleStreams.filter(
        stream => !validStreams.includes(stream)
      );
      
      if (invalidStreams.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid streams: ${invalidStreams.join(', ')}. Valid: SCIENCE, ARTS, COMMERCIAL`,
          },
          { status: 400 }
        );
      }
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        schoolId: teacher.schoolId,
        name,
        code,
        description: description || null,
        subjectType,
        classLevel,
        eligibleStreams: eligibleStreams || [],
        isElectiveOption: isElectiveOption || false,
        electiveGroup: electiveGroup || null,
        maxStudents: maxStudents || null,
        creditHours: creditHours || null,
        isActive: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        schoolId: teacher.schoolId,
        userId: authResult.userId,
        action: 'CREATE',
        entity: 'Subject',
        entityId: subject.id,
        changes: {
          name,
          code,
          subjectType,
          classLevel,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      subject,
    });

  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create subject',
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
