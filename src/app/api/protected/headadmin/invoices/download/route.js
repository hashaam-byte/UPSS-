// app/api/protected/headadmin/invoices/[id]/download/route.js
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

    // Find invoice with school details
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
            phone: true,
            logo: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate HTML for PDF (you can use a template engine like handlebars)
    const invoiceHtml = generateInvoiceHTML(invoice);

    // For now, we'll return the HTML content
    // In production, you'd want to use a PDF generation library like puppeteer or jsPDF
    
    // If you want to generate actual PDF, uncomment and implement:
    /*
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(invoiceHtml);
    const pdf = await page.pdf({ 
      format: 'A4',
      printBackground: true,
      margin: { top: '1in', bottom: '1in', left: '1in', right: '1in' }
    });
    await browser.close();

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`
      }
    });
    */

    // For now, return HTML that opens in new tab
    return new NextResponse(invoiceHtml, {
      headers: {
        'Content-Type': 'text/html',
      }
    });

  } catch (error) {
    console.error('Failed to download invoice:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

function generateInvoiceHTML(invoice) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #333;
          line-height: 1.6;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 20px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #3b82f6;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-number {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
        }
        .status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .status.paid { background: #d1fae5; color: #065f46; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.overdue { background: #fee2e2; color: #991b1b; }
        .status.cancelled { background: #f3f4f6; color: #4b5563; }
        .billing-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 16px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 8px;
        }
        .detail-row {
          margin-bottom: 8px;
        }
        .detail-label {
          font-weight: 600;
          color: #4b5563;
        }
        .detail-value {
          color: #1f2937;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .invoice-table th {
          background: #f8fafc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .invoice-table td {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .total-section {
          text-align: right;
          margin-top: 30px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 8px 0;
        }
        .total-row.final {
          border-top: 2px solid #3b82f6;
          padding-top: 16px;
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">U-PLUS ACADEMY</div>
        <div class="invoice-info">
          <div class="invoice-number">Invoice ${invoice.invoiceNumber}</div>
          <div class="status ${invoice.status}">${invoice.status}</div>
        </div>
      </div>

      <div class="billing-details">
        <div>
          <div class="section-title">Bill To</div>
          <div class="detail-row">
            <div class="detail-label">School:</div>
            <div class="detail-value">${invoice.school?.name || 'N/A'}</div>
          </div>
          ${invoice.school?.email ? `
            <div class="detail-row">
              <div class="detail-label">Email:</div>
              <div class="detail-value">${invoice.school.email}</div>
            </div>
          ` : ''}
          ${invoice.school?.phone ? `
            <div class="detail-row">
              <div class="detail-label">Phone:</div>
              <div class="detail-value">${invoice.school.phone}</div>
            </div>
          ` : ''}
          ${invoice.school?.address ? `
            <div class="detail-row">
              <div class="detail-label">Address:</div>
              <div class="detail-value">${invoice.school.address}</div>
            </div>
          ` : ''}
        </div>
        
        <div>
          <div class="section-title">Invoice Details</div>
          <div class="detail-row">
            <div class="detail-label">Issue Date:</div>
            <div class="detail-value">${formatDate(invoice.createdAt)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Due Date:</div>
            <div class="detail-value">${formatDate(invoice.dueDate)}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Billing Period:</div>
            <div class="detail-value">${invoice.billingPeriod}</div>
          </div>
          ${invoice.paidAt ? `
            <div class="detail-row">
              <div class="detail-label">Paid Date:</div>
              <div class="detail-value">${formatDate(invoice.paidAt)}</div>
            </div>
          ` : ''}
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Students</th>
            <th>Teachers</th>
            <th>Rate per User</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>${invoice.description || 'Monthly Subscription'}</strong>
              <br>
              <small style="color: #6b7280;">${invoice.billingPeriod}</small>
            </td>
            <td>${invoice.studentCount || 0}</td>
            <td>${invoice.teacherCount || 0}</td>
            <td>${formatCurrency(invoice.pricePerUser || 0)}</td>
            <td><strong>${formatCurrency(invoice.amount)}</strong></td>
          </tr>
        </tbody>
      </table>

      <div class="total-section">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.amount)}</span>
        </div>
        <div class="total-row">
          <span>Tax (0%):</span>
          <span>${formatCurrency(0)}</span>
        </div>
        <div class="total-row final">
          <span>Total Amount:</span>
          <span>${formatCurrency(invoice.amount)}</span>
        </div>
      </div>

      <div class="footer">
        <p>This is a computer-generated invoice. Thank you for your business!</p>
        <p>U-Plus Academy - Empowering Education Through Technology</p>
      </div>

      <script>
        // Auto print when opened
        window.onload = function() {
          setTimeout(() => window.print(), 500);
        }
      </script>
    </body>
    </html>
  `;
}