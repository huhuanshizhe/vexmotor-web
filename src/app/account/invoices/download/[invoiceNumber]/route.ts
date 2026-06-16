import { NextResponse } from 'next/server';

import { getAccountInvoiceByNumber } from '@/lib/account-portal';
import { buildSimplePdf } from '@/lib/certifications';

export async function GET(_: Request, context: { params: Promise<{ invoiceNumber: string }> }) {
  const { invoiceNumber } = await context.params;
  const invoice = getAccountInvoiceByNumber(invoiceNumber);

  if (!invoice) {
    return NextResponse.json({ code: 'NOT_FOUND', message: 'Invoice not found' }, { status: 404 });
  }

  const pdf = buildSimplePdf([
    'STEPMOTECH Invoice Reference',
    `Invoice: ${invoice.invoiceNumber}`,
    `Order: ${invoice.orderNumber}`,
    `Date: ${invoice.date}`,
    `Amount: ${invoice.amountLabel}`,
    `Currency: ${invoice.currency}`,
    `Status: ${invoice.status}`,
    `Due date: ${invoice.dueDate}`,
  ]);

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}