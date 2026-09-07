// /api/protected/admin/fees
// Admin creates fees for students and lists them. Settlement is manual
// bank transfer + confirmation for now — see StudentFeePayment.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['ADMIN']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');

    const fees = await prisma.studentFee.findMany({
      where: {
        schoolId: user.schoolId,
        ...(status && { status }),
        ...(studentId && { studentId }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true, studentProfile: { select: { studentId: true, className: true } } } },
        payments: { orderBy: { paymentDate: 'desc' } },
      }
    });

    return NextResponse.json({ success: true, data: fees });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Fees list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['ADMIN']);
    const body = await request.json();
    const { studentId, studentIds, title, description, amount, termName, academicYear, dueDate } = body;

    if ((!studentId && !studentIds) || !title || !amount) {
      return NextResponse.json({ error: 'studentId (or studentIds), title, and amount are required' }, { status: 400 });
    }

    const targetIds = studentIds && Array.isArray(studentIds) ? studentIds : [studentId];

    // Verify every target student actually belongs to this admin's school
    const validStudents = await prisma.user.findMany({
      where: { id: { in: targetIds }, schoolId: user.schoolId, role: 'STUDENT' },
      select: { id: true }
    });
    if (validStudents.length !== targetIds.length) {
      return NextResponse.json({ error: 'One or more students were not found in your school' }, { status: 404 });
    }

    const created = await prisma.studentFee.createMany({
      data: validStudents.map(s => ({
        schoolId: user.schoolId,
        studentId: s.id,
        title,
        description: description || null,
        amount,
        termName: termName || null,
        academicYear: academicYear || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: user.id,
      }))
    });

    return NextResponse.json({ success: true, message: `Fee created for ${created.count} student(s)` }, { status: 201 });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Fee create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
