import { NextResponse } from 'next/server';

import { buildSimplePdf, buildZipArchive } from '@/lib/certifications';
import { getResourceItemBySlug } from '@/lib/resources';

function toTextPayload(slug: string, title: string, summary: string) {
  return [
    `STEPMOTECH Resource: ${title}`,
    `Slug: ${slug}`,
    '',
    summary,
    '',
    'This placeholder file mirrors the gated/downloadable resource flow while the full production asset library is migrated into Next.js.',
  ].join('\n');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const resource = getResourceItemBySlug(slug);

  if (!resource || !resource.downloadKind || !resource.downloadFileName) {
    return new NextResponse('Not found', { status: 404 });
  }

  if (resource.downloadKind === 'pdf') {
    const pdf = buildSimplePdf([
      resource.title,
      '',
      resource.summary,
      '',
      `Topic: ${resource.topic}`,
      `Product line: ${resource.productLine}`,
      `Language: ${resource.language}`,
      resource.sku ? `SKU: ${resource.sku}` : '',
      resource.duration ? `Duration: ${resource.duration}` : '',
      resource.eventDate ? `Session: ${resource.eventDate}` : '',
    ].filter(Boolean));

    return new NextResponse(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${resource.downloadFileName}"`,
      },
    });
  }

  if (resource.downloadKind === 'zip') {
    const archive = buildZipArchive([
      {
        name: 'README.txt',
        content: toTextPayload(resource.slug, resource.title, resource.summary),
      },
      {
        name: resource.sku ? `${resource.sku.toLowerCase()}-notes.txt` : `${resource.slug}-notes.txt`,
        content: [
          `Format: ${resource.format}`,
          `Topic: ${resource.topic}`,
          `Product line: ${resource.productLine}`,
          resource.sku ? `SKU: ${resource.sku}` : 'SKU: n/a',
          '',
          'Included files are represented as placeholders during the migration process.',
        ].join('\n'),
      },
    ]);

    return new NextResponse(archive, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${resource.downloadFileName}"`,
      },
    });
  }

  return new NextResponse(toTextPayload(resource.slug, resource.title, resource.summary), {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${resource.downloadFileName}"`,
    },
  });
}