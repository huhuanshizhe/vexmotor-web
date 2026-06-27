import { NextResponse } from 'next/server';

import { buildBlogCoverBackgroundSvg, buildBlogCoverSvg } from '@/lib/blog-cover-styles';
import { getStorefrontBlogDetail } from '@/lib/storefront-api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const plain = new URL(request.url).searchParams.get('plain') === '1';
  const post = await getStorefrontBlogDetail(slug);

  if (!post) {
    return new NextResponse('Not found', { status: 404 });
  }

  const svg = plain
    ? buildBlogCoverBackgroundSvg(post.coverStyle)
    : buildBlogCoverSvg({
        title: post.title,
        category: post.category,
        coverStyle: post.coverStyle,
      });

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
