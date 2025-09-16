
// pages/api/protected/headadmin/invoices/create.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../lib/authHelpers';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyHeadAdminAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
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
    } = req.body;

    // Validate required fields
    if (!schoolId || !billingPeriod || !dueDate || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: schoolId, billingPeriod, dueDate, amount' 
      });
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Check if invoice already exists for this billing period
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        schoolId,
        billingPeriod
      }
    });

    if (existingInvoice) {
      return res.status(409).json({ 
        error: 'Invoice already exists for this billing period' 
      });
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
        createdBy: authResult.user.id
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
        userId: authResult.user.id,
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

    return res.status(201).json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Failed to create invoice:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
