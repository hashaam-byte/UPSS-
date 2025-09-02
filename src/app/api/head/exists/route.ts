import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const headAdminCount = await prisma.headAdmin.count();
    return NextResponse.json({ exists: headAdminCount > 0 });
  } catch (error) {
    console.error('Error checking head admin:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
