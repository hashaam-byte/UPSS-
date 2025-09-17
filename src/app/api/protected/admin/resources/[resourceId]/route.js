import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(['admin']);
    const { resourceId } = params;

    // Find the resource
    const resource = await prisma.resource.findFirst({
      where: {
        id: resourceId,
        schoolId: user.schoolId
      }
    });

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    if (resource.filename) {
      try {
        const filePath = join(process.cwd(), 'public', 'uploads', 'resources', resource.filename);
        await unlink(filePath);
      } catch (error) {
        console.warn('Failed to delete file from filesystem:', error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await prisma.resource.delete({
      where: { id: resourceId }
    });

    return NextResponse.json({
      success: true,
      message: 'Resource deleted successfully'
    });

  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
