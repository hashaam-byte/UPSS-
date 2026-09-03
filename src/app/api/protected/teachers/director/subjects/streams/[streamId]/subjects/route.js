// API Route: /api/protected/teachers/director/subjects/streams/[streamId]/subjects/route.js
// Map subjects to a stream (Add/Remove subjects from stream)

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// GET subjects mapped to a stream
export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const { streamId } = params;
    
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

    if (!teacher || teacher.teacherRole !== 'DIRECTOR' || teacher.levelSpecialization !== 'SENIOR') {
      return NextResponse.json(
        { success: false, error: 'Only SS Directors can access stream mappings' },
        { status: 403 }
      );
    }

    // Get stream with mappings
    const stream = await prisma.subjectStream.findUnique({
      where: { id: streamId },
      include: {
        subjectMappings: {
          include: {
            subject: true,
          },
          orderBy: [
            { isCore: 'desc' },
            { position: 'asc' },
          ],
        },
      },
    });

    if (!stream) {
      return NextResponse.json(
        { success: false, error: 'Stream not found' },
        { status: 404 }
      );
    }

    if (stream.schoolId !== teacher.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Cannot access streams from another school' },
        { status: 403 }
      );
    }

    // Separate core and elective subjects
    const coreSubjects = stream.subjectMappings
      .filter(m => m.isCore)
      .map(m => ({
        mappingId: m.id,
        ...m.subject,
        electiveGroup: m.electiveGroup,
      }));

    const electiveSubjects = stream.subjectMappings
      .filter(m => m.isElective)
      .map(m => ({
        mappingId: m.id,
        ...m.subject,
        electiveGroup: m.electiveGroup,
      }));

    return NextResponse.json({
      success: true,
      stream: {
        id: stream.id,
        name: stream.name,
        displayName: stream.displayName,
        description: stream.description,
        minimumElectives: stream.minimumElectives,
        maximumElectives: stream.maximumElectives,
      },
      coreSubjects,
      electiveSubjects,
      totalMappings: stream.subjectMappings.length,
    });

  } catch (error) {
    console.error('Error fetching stream mappings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch stream mappings',
        details: error.message,
      },
      { status: 500 }
    );
}
}

// POST - Add subject to stream
export async function POST(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const { streamId } = params;
    
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

    if (!teacher || teacher.teacherRole !== 'DIRECTOR' || teacher.levelSpecialization !== 'SENIOR') {
      return NextResponse.json(
        { success: false, error: 'Only SS Directors can map subjects to streams' },
        { status: 403 }
      );
    }

    // Get stream
    const stream = await prisma.subjectStream.findUnique({
      where: { id: streamId },
    });

    if (!stream || stream.schoolId !== teacher.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      subjectId,
      isCore,
      isElective,
      electiveGroup,
      position,
    } = body;

    // Validation
    if (!subjectId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: subjectId' },
        { status: 400 }
      );
    }

    if (!isCore && !isElective) {
      return NextResponse.json(
        { success: false, error: 'Subject must be either core or elective' },
        { status: 400 }
      );
    }

    // Get subject
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    });

    if (!subject || subject.schoolId !== teacher.schoolId) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if mapping already exists
    const existingMapping = await prisma.subjectStreamMapping.findUnique({
      where: {
        streamId_subjectId: {
          streamId,
          subjectId,
        },
      },
    });

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Subject is already mapped to this stream' },
        { status: 400 }
      );
    }

    // Create mapping
    const mapping = await prisma.subjectStreamMapping.create({
      data: {
        streamId,
        subjectId,
        isCore: isCore || false,
        isElective: isElective || false,
        electiveGroup: electiveGroup || null,
        position: position || null,
      },
      include: {
        subject: true,
        stream: true,
      },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        schoolId: teacher.schoolId,
        userId: authResult.userId,
        action: 'CREATE',
        entity: 'SubjectStreamMapping',
        entityId: mapping.id,
        changes: {
          streamName: stream.displayName,
          subjectName: subject.name,
          isCore,
          isElective,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Subject mapped to stream successfully',
      mapping,
    });

  } catch (error) {
    console.error('Error mapping subject to stream:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to map subject to stream',
        details: error.message,
      },
      { status: 500 }
    );
}
}
