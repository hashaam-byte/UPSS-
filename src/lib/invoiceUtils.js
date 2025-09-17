// lib/invoiceUtils.js
import { prisma } from '@/lib/prisma';

export class InvoiceManager {
  
  // Generate unique invoice number
  static async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get the count of invoices for this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const endOfMonth = new Date(year, new Date().getMonth() + 1, 0);
    
    const invoiceCount = await prisma.invoice.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });
    
    const sequence = String(invoiceCount + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequence}`;
  }

  // Calculate invoice amount based on user counts
  static calculateInvoiceAmount(studentCount, teacherCount, pricePerUser = 100) {
    const totalUsers = (studentCount || 0) + (teacherCount || 0);
    return totalUsers * pricePerUser;
  }

  // Check if invoice is overdue
  static isInvoiceOverdue(invoice) {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return false;
    }
    return new Date() > new Date(invoice.dueDate);
  }

  // Update overdue invoices
  static async updateOverdueInvoices() {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: 'pending',
        dueDate: {
          lt: new Date()
        }
      }
    });

    if (overdueInvoices.length > 0) {
      await prisma.invoice.updateMany({
        where: {
          id: {
            in: overdueInvoices.map(inv => inv.id)
          }
        },
        data: {
          status: 'overdue'
        }
      });
    }

    return overdueInvoices.length;
  }

  // Generate bulk invoices for all active schools
  static async generateMonthlyInvoices(billingDate = new Date()) {
    const year = billingDate.getFullYear();
    const month = String(billingDate.getMonth() + 1).padStart(2, '0');

    // Get all active schools
    const schools = await prisma.school.findMany({
      where: { status: 'active' },
      include: {
        students: true,
        teachers: true
      }
    });

    const invoices = [];

    for (const school of schools) {
      const studentCount = school.students.length;
      const teacherCount = school.teachers.length;
      const amount = this.calculateInvoiceAmount(studentCount, teacherCount);

      const invoiceNumber = await this.generateInvoiceNumber();

      const dueDate = new Date(billingDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          schoolId: school.id,
          amount,
          status: 'pending',
          issuedDate: billingDate,
          dueDate
        }
      });

      invoices.push(invoice);
    }

        return invoices;
      }
    }