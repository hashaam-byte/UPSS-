import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // For now, return a simple CSV-like response
    // In production, you'd generate an actual PDF or Excel file
    const csvData = `Date,Total Users,Active Users,New Users
${new Date().toISOString().split('T')[0]},100,85,12
${new Date(Date.now() - 86400000).toISOString().split('T')[0]},98,82,8
${new Date(Date.now() - 2*86400000).toISOString().split('T')[0]},96,80,5`;

    return new Response(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-report-${range}.csv"`
      }
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}
