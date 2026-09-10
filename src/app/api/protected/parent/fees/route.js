// /api/protected/parent/fees
// Read-only view of fees for every child linked to this parent.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['PARENT']);

    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
      include: { children: { select: { studentId: true } } }
    });
    if (!parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const childIds = parentProfile.children.map(c => c.studentId);

    const fees = await prisma.studentFee.findMany({
      where: { studentId: { in: childIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      }
    });

    // A parent may have children at different schools — check which of
    // those schools actually have an active payment gateway connected.
    const schoolIds = [...new Set(fees.map(f => f.schoolId))];
    const activeConfigs = await prisma.schoolPaymentConfig.findMany({
      where: { schoolId: { in: schoolIds }, isActive: true },
      select: { schoolId: true },
    });
    const schoolsWithGateway = new Set(activeConfigs.map(c => c.schoolId));

    return NextResponse.json({
      success: true,
      data: fees.map(f => ({
        id: f.id,
        studentName: `${f.student.firstName} ${f.student.lastName}`,
        title: f.title,
        description: f.description,
        amount: f.amount,
        amountPaid: f.amountPaid,
        balance: Number(f.amount) - Number(f.amountPaid),
        status: f.status,
        term: f.termName,
        academicYear: f.academicYear,
        dueDate: f.dueDate,
        canPayOnline: schoolsWithGateway.has(f.schoolId),
        payments: f.payments.map(p => ({
          amount: p.amount,
          date: p.paymentDate,
          method: p.method,
          reference: p.reference,
        })),
      }))
    });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Parent fees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
