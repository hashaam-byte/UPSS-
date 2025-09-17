import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    const folders = await prisma.resourceFolder.findMany({
      where: {
        schoolId: user.schoolId,
        parentId: parentId || null
      },
      include: {
        _count: {
          select: {
            resources: true,
            children: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      folders: folders.map(folder => ({
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        resourceCount: folder._count.resources,
        subfolderCount: folder._count.children
      }))
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.error('Get folders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['admin']);
    const { name, description, parentId } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    // Check if folder with same name exists in the same parent
    const existingFolder = await prisma.resourceFolder.findFirst({
      where: {
        schoolId: user.schoolId,
        name: name.trim(),
        parentId: parentId || null
      }
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder with this name already exists' },
        { status: 409 }
      );
    }

    const folder = await prisma.resourceFolder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        schoolId: user.schoolId,
        parentId: parentId || null,
        createdById: user.id
      }
    });

    return NextResponse.json({
      success: true,
      folder: {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentId: folder.parentId,
        createdAt: folder.createdAt
      }
    });

  } catch (error) {
    console.error('Create folder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
