// /app/api/protected/students/resources/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['STUDENT']);
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const type = searchParams.get('type');

    // A student should see: resources with no class targeting (whole-school
    // shares) OR resources specifically targeted at their own class. Never
    // resources targeted at a different class.
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    // Build where clause
    const whereClause = {
      schoolId: user.schoolId,
      OR: [
        { targetClass: null },
        ...(studentProfile?.className ? [{ targetClass: studentProfile.className }] : [])
      ]
    };

    if (folderId) {
      whereClause.folderId = folderId;
    }

    if (type && type !== 'all') {
      if (type === 'document') {
        whereClause.mimeType = {
          in: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        };
      } else if (type === 'image') {
        whereClause.mimeType = { startsWith: 'image/' };
      } else if (type === 'video') {
        whereClause.mimeType = { startsWith: 'video/' };
      }
    }

    // Fetch resources
    const resources = await prisma.resource.findMany({
      where: whereClause,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        folder: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Fetch folders
    const folders = await prisma.resourceFolder.findMany({
      where: {
        schoolId: user.schoolId
      },
      include: {
        _count: {
          select: {
            resources: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        resources,
        folders
      }
    });
  } catch (error) {
    console.error('Get resources error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}
