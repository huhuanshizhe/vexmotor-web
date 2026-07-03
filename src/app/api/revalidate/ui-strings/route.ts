import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

import { UI_STRINGS_CACHE_TAG } from '@/lib/ui-strings-client';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  const expected = process.env.REVALIDATE_SECRET?.trim();

  if (!expected || secret !== expected) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Invalid revalidate secret' }, { status: 401 });
  }

  revalidateTag(UI_STRINGS_CACHE_TAG, 'max');
  return NextResponse.json({ revalidated: true, tag: UI_STRINGS_CACHE_TAG });
}
