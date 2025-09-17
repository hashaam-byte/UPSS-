import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);
    const { searchParams } = new URL(request.url);

    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      schoolId: user.schoolId,
      ...(folderId && { folderId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Get resources with pagination
    const [resources, totalCount] = await Promise.all([
      prisma.resource.findMany({
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
        },
        skip,
        take: limit
      }),
      prisma.resource.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      resources: resources.map(resource => ({
        id: resource.id,
        name: resource.name,
        description: resource.description,
        url: resource.url,
        mimeType: resource.mimeType,
        size: resource.size,
        createdAt: resource.createdAt,
        updatedAt: resource.updatedAt,
        uploadedBy: {
          id: resource.uploadedBy.id,
          name: `${resource.uploadedBy.firstName} ${resource.uploadedBy.lastName}`
        },
        folder: resource.folder
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Get resources error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
