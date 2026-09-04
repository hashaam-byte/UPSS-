import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['TEACHER']);
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('class');

    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true,
        ...(className && {
          classLevel: { has: className.match(/^(JSS|JS|SS)[1-3]/)?.[0] || className }
        })
      }
    });

    return NextResponse.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
     