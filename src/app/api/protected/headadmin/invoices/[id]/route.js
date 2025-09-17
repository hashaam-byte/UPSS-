// pages/api/protected/headadmin/invoices/[id]/index.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id } = params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            email: true,
            slug: true,
            address: true,
            phone: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
  
