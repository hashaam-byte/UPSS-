// pages/api/protected/headadmin/invoices/create.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const {
      schoolId,
      billingPeriod,
      description,
      dueDate,
      amount,
      studentCount = 0,
      teacherCount = 0,
      adminCount = 0
    } = await request.json();

    // Validate required fields
    if (!schoolId || !billingPeriod || !dueDate || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: schoolId, billingPeriod, dueDate, amount' 
      }, { status: 400 });
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // Check if invoice already exists for this billing period
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        schoolId,
        billingPeriod
      }
    });

    if (existingInvoice) {
      return NextResponse.json({ 
        error: 'Invoice already exists for this billing period' 
      }, { status: 409 });
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        schoolId,
        invoiceNumber,
        amount: parseFloat(amount),
        currency: 'NGN',
        description: description || `Monthly subscription for ${school.name} - ${billingPeriod}`,
        billingPeriod,
        studentCount: parseInt(studentCount),
        teacherCount: parseInt(teacherCount),
        adminCount: parseInt(adminCount),
        status: 'pending',
        dueDate: new Date(dueDate),
        createdBy: user.id
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'invoice_created',
        resource: 'invoice',
        resourceId: invoice.id,
        description: `Created invoice ${invoiceNumber} for ${school.name}`,
        metadata: {
          invoiceNumber,
          schoolName: school.name,
          amount: parseFloat(amount),
          billingPeriod
        }
      }
    });

    return NextResponse.json({
      success: true,
      invoice
    }, { status: 201 });

  } catch (error) {
    console.error('Failed to create invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
 
