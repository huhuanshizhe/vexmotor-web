import { NextResponse } from 'next/server';

import { buildSimplePdf } from '@/lib/certifications';
import { getLegalPageBySlug, legalPages } from '@/lib/legal-content';

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

function formatDate(iso: string) {
  return dateFormatter.format(new Date(`${iso}T00:00:00Z`));
}

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getLegalPageBySlug(slug);

  if (!page) {
    return new NextResponse('Not found', { status: 404 });
  }

  const lines = [
    `STEPMOTECH — ${page.title}`,
    `Last updated: ${formatDate(page.lastUpdated)}`,
    `Effective date: ${formatDate(page.effectiveDate)}`,
    '',
    'Version history',
    '----------------------------------------',
    ...page.versionHistory.map((entry) => `${entry.version}  ${formatDate(entry.date)}  ${entry.summary}`),
  ];

  const pdf = buildSimplePdf(lines);

  return new NextResponse(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="stepmotech-${page.slug}-version-history.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
