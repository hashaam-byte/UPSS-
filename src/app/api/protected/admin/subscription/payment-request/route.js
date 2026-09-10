import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/platform-settings';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const user = await requireAuth(['ADMIN']);
    const body = await request.json();
    const { paymentType, studentCount, teacherCount } = body;

    if (!['individual', 'bulk'].includes(paymentType)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const parsedStudentCount = Number(studentCount);
    const parsedTeacherCount = Number(teacherCount);
    if (!Number.isInteger(parsedStudentCount) || parsedStudentCount < 0 ||
        !Number.isInteger(parsedTeacherCount) || parsedTeacherCount < 0) {
      return NextResponse.json({ error: 'Invalid user counts' }, { status: 400 });
    }

    const schoolId = user.schoolId;
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    const platformSettings = await getPlatformSettings();
    const totalUsers = parsedStudentCount + parsedTeacherCount + 1;
    const individualPrice = Number(platformSettings.pricing_individual_per_user);
    const bulkPrice = Number(platformSettings.pricing_bulk_per_user);
    const bulkThreshold = Number(platformSettings.pricing_bulk_threshold);
    const bulkFlatCost = Number(platformSettings.pricing_bulk_flat_cost);
    const amount = paymentType === 'bulk' && totalUsers > bulkThreshold
      ? bulkFlatCost
      : totalUsers * (paymentType === 'bulk' ? bulkPrice : individualPrice);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Unable to calculate payment amount' }, { status: 500 });
    }

    const now = new Date();
    const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const existingInvoice = await prisma.invoice.findFirst({
      where: { schoolId, billingPeriod, status: 'pending' },
      orderBy: { createdAt: 'desc' },
    });

    if (existingInvoice) {
      return NextResponse.json({
        success: true,
        message: 'A pending payment request already exists for this billing period.',
        invoice: existingInvoice,
      });
    }

    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${now.getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;
    const invoice = await prisma.invoice.create({
      data: {
        schoolId,
        invoiceNumber,
        amount,
        currency: 'NGN',
        description: `${paymentType === 'bulk' ? 'Bulk' : 'Individual'} subscription payment for ${school.name}`,
        billingPeriod,
        studentCount: parsedStudentCount,
        teacherCount: parsedTeacherCount,
        adminCount: 1,
        status: 'pending',
        createdBy: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'subscription_payment_requested',
        resource: 'Invoice',
        resourceId: invoice.id,
        description: `Requested ${paymentType} subscription payment for ${school.name}`,
        metadata: { paymentType, amount, billingPeriod },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment request submitted successfully.',
      invoice,
    }, { status: 201 });
  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied. Only school admins can request payments.' }, { status: 403 });
    }

    console.error('Subscription payment request error:', error);
    return NextResponse.json({ error: 'Failed to process payment request' }, { status: 500 });
  }
}
