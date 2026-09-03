// API Route: /api/protected/teachers/director/subjects/streams/route.js
// Get all streams and create new streams (SS Director only)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET all streams
export async function GET(request) {
  try {
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
        { success: false, error: 'Only Directors can access streams' },
        { status: 403 }
      );
    }

    // Only SS Directors can manage streams
    if (teacher.levelSpecialization !== 'SENIOR') {
      return NextResponse.json(
        { success: false, error: 'Only SS Directors can manage streams' },
        { status: 403 }
      );
    }

    // Get all streams for the school
    const streams = await prisma.subjectStream.findMany({
      where: {
        schoolId: teacher.schoolId,
      },
      include: {
        subjectMappings: {
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
        _count: {
          select: {
            subjectMappings: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Get student enrollment per stream
    const streamEnrollment = await Promise.all(
      streams.map(async (stream) => {
        const count = await prisma.studentSubjectSelection.count({
          where: {
            schoolId: teacher.schoolId,
            stream: stream.name,
            selectionComplete: true,
          },
        });

        return {
          streamId: stream.id,
          streamName: stream.displayName,
          enrollmentCount: count,
        };
      })
    );

    return NextResponse.json({
      success: true,
      streams,
      enrollment: streamEnrollment,
    });

  } catch (error) {
    console.error('Error fetching streams:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch streams',
        details: error.message,
      },
      { status: 500 }
    );
}
}

// CREATE new stream
export async function POST(request) {
  try {
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
        { success: false, error: 'Only Directors can create streams' },
        { status: 403 }
      );
    }

    // Only SS Directors can manage streams
    if (teacher.levelSpecialization !== 'SENIOR') {
      return NextResponse.json(
        { success: false, error: 'Only SS Directors can create streams' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      name,
      displayName,
      description,
      classLevel,
      minimumElectives,
      maximumElectives,
    } = body;

    // Validation
    if (!name || !displayName || !classLevel) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, displayName, classLevel',
        },
        { status: 400 }
      );
    }

    // Validate stream name
    const validStreamNames = ['SCIENCE', 'ARTS', 'COMMERCIAL'];
    if (!validStreamNames.includes(name)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid stream name. Valid options: ${validStreamNames.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate class level
    if (classLevel !== 'SS') {
      return NextResponse.json(
        {
          success: false,
          error: 'Streams can only be created for Senior Secondary (SS)',
        },
        { status: 400 }
      );
    }

    // Check if stream already exists
    const existingStream = await prisma.subjectStream.findUnique({
      where: {
        schoolId_name_classLevel: {
          schoolId: teacher.schoolId,
          name,
          classLevel,
        },
      },
    });

    if (existingStream) {
      return NextResponse.json(
        {
          success: false,
          error: `Stream "${displayName}" already exists for this level`,
        },
        { status: 400 }
      );
    }

    // Create stream
    const stream = await prisma.subjectStream.create({
      data: {
        schoolId: teacher.schoolId,
        name,
        displayName,
        description: description || null,
        classLevel,
        minimumElectives: minimumElectives || 2,
        maximumElectives: maximumElectives || 4,
        isActive: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        schoolId: teacher.schoolId,
        userId: authResult.userId,
        action: 'CREATE',
        entity: 'SubjectStream',
        entityId: stream.id,
        changes: {
          name,
          displayName,
          classLevel,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Stream created successfully',
      stream,
    });

  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create stream',
        details: error.message,
      },
      { status: 500 }
    );
}
}
