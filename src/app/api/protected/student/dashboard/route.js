import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth(['student']);
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id }
    });

    return NextResponse.json({ dashboard: { studentProfile } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
