import { NextResponse } from 'next/server';

import { buildSimplePdf, getCertificationRecord } from '@/lib/certifications';

export async function GET(_: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const record = getCertificationRecord(slug);

  if (!record) {
    return NextResponse.json({ code: 'NOT_FOUND', message: 'Certificate file not found' }, { status: 404 });
  }

  const pdf = buildSimplePdf([
    'STEPMOTECH Compliance Reference',
    `${record.code} - ${record.title}`,
    `Applicable lines: ${record.applicableLines.join(', ')}`,
    `Issuer route: ${record.issuer}`,
    `Summary: ${record.summary}`,
    'This downloadable reference is intended for planning, qualification review, and support intake.',
    'Signed or audited files can be requested through the technical support desk when program requirements need them.',
  ]);

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${record.downloadFileName}"`,
      'Cache-Control': 'no-store',
    },
  });
}