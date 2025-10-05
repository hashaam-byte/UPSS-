
// /app/api/protected/students/resources/download/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['student']);
    const { id } = params;

    const resource = await prisma.resource.findFirst({
      where: {
        id,
        schoolId: user.schoolId
      }
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, error: 'Resource not found' },
        { status: 404 }
      );
    }

    // In production, you would fetch the file from your storage (S3, etc.)
    // For now, we'll redirect to the URL
    return NextResponse.redirect(resource.url);
  } catch (error) {
    console.error('Download resource error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to download resource' },
      { status: 500 }
    );
  }
}