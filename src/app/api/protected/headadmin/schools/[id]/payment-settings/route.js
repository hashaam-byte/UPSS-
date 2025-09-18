import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const user = await requireAuth(['headadmin']);
    const { id } = params;
    const { daysTillNextPayment } = await request.json();

    if (typeof daysTillNextPayment !== 'number' || daysTillNextPayment < 0) {
      return NextResponse.json(
        { error: 'Invalid daysTillNextPayment' },
        { status: 400 }
      );
    }

    await prisma.school.update({
      where: { id },
      data: { customNextPaymentDays: daysTillNextPayment }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
