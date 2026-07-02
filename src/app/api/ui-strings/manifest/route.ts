import { NextResponse } from 'next/server';

import { buildUiStringsManifest } from '@/ui-strings/manifest';

export async function GET() {
  const manifest = buildUiStringsManifest();
  return NextResponse.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
