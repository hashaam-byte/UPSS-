// pages/api/protected/headadmin/invoices/index.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch all invoices with school details
    const invoices = await prisma.invoice.findMany({
      include: {
        school: {
          select: {
            id: true,
            name: true,
            email: true,
            slug: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Ensure each invoice has a school object (null if not found)
    const invoicesWithSchool = await Promise.all(
      invoices.map(async (invoice) => {
        if (invoice.school) {
          return invoice;
        }
        // If school relation is missing, fetch it directly
        if (invoice.schoolId) {
          const school = await prisma.school.findUnique({
            where: { id: invoice.schoolId },
            select: {
              id: true,
              name: true,
              email: true,
              slug: true
            }
          });
          return { ...invoice, school: school || null };
        }
        return { ...invoice, school: null };
      })
    );

    return NextResponse.json({
      success: true,
      invoices: invoicesWithSchool
    });

  } catch (error) {
    console.error('Failed to fetch invoices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
