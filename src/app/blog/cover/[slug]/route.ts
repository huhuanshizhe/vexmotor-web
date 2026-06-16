import { NextResponse } from 'next/server';

import { getBlogCatalog, findBlogPostInCatalog } from '@/lib/storefront-api';

const categoryColorMap: Record<string, { start: string; end: string }> = {
  'Technical Guide': { start: '#153858', end: '#d65b22' },
  'Application Note': { start: '#0f5c72', end: '#d65b22' },
  'Tutorial': { start: '#204b33', end: '#d6a322' },
  'News & Updates': { start: '#472450', end: '#d65b22' },
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const catalog = await getBlogCatalog();
  const post = findBlogPostInCatalog(catalog, slug);

  if (!post) {
    return new NextResponse('Not found', { status: 404 });
  }

  const colors = categoryColorMap[post.category] ?? categoryColorMap['Technical Guide']!;
  const title = escapeXml(post.title);
  const meta = escapeXml(`${post.category} · ${post.readMinutes} min read`);
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="${colors.start}" />
          <stop offset="1" stop-color="${colors.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" rx="36" fill="url(#bg)" />
      <circle cx="1020" cy="110" r="180" fill="rgba(255,255,255,0.08)" />
      <circle cx="180" cy="560" r="200" fill="rgba(255,255,255,0.06)" />
      <text x="72" y="110" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="28" letter-spacing="3">ENGINEERING BLOG</text>
      <foreignObject x="72" y="150" width="900" height="280">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Segoe UI, Arial, sans-serif; font-size: 60px; line-height: 1.06; font-weight: 700; color: white;">
          ${title}
        </div>
      </foreignObject>
      <text x="72" y="520" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="30">${meta}</text>
      <text x="72" y="570" fill="rgba(255,255,255,0.82)" font-family="Segoe UI, Arial, sans-serif" font-size="26">STEPMOTECH</text>
    </svg>
  `;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}