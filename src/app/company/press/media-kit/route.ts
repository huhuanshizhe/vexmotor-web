import { NextResponse } from 'next/server';

import { buildZipArchive } from '@/lib/certifications';
import { getPressCatalog } from '@/lib/storefront-api';

export async function GET() {
  const pressCatalog = await getPressCatalog();
  const archive = buildZipArchive([
    {
      name: pressCatalog.mediaKitContents[0],
      content: [`STEPMOTECH Boilerplate`, '', pressCatalog.boilerplate].join('\n'),
    },
    {
      name: pressCatalog.mediaKitContents[1],
      content: ['STEPMOTECH Logo Usage Guide', '', 'Use the primary wordmark on clean backgrounds with sufficient spacing.', 'Avoid stretching, recoloring, or placing the mark over low-contrast imagery.'].join('\n'),
    },
    {
      name: pressCatalog.mediaKitContents[2],
      content: ['Executive Profile Summary', '', 'Company leadership messaging can be requested through the press contact route when a publication needs approved background notes.'].join('\n'),
    },
    {
      name: pressCatalog.mediaKitContents[3],
      content: ['Press Contact', '', 'Email: support@stepmotech.online', 'Support path: /support/contact?topic=press'].join('\n'),
    },
  ]);

  return new NextResponse(archive, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="stepmotech-media-kit.zip"',
      'Cache-Control': 'no-store',
    },
  });
}