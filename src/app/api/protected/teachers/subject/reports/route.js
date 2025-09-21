import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await requireAuth(['subject_teacher']);
    // Fetch reports for subject teacher
    return NextResponse.json({ reports: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
