import { NextResponse } from 'next/server';

import { getApplicationCaseStudyBySlug } from '@/lib/applications';

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
  const caseStudy = getApplicationCaseStudyBySlug(slug);

  if (!caseStudy) {
    return new NextResponse('Not found', { status: 404 });
  }

  const title = escapeXml(caseStudy.title);
  const subline = escapeXml(`${caseStudy.industryTitle} · ${caseStudy.resultHeadline}`);
  const svg = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="#102942" />
          <stop offset="1" stop-color="#d65b22" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" rx="36" fill="url(#bg)" />
      <circle cx="1080" cy="120" r="170" fill="rgba(255,255,255,0.07)" />
      <circle cx="120" cy="560" r="190" fill="rgba(255,255,255,0.05)" />
      <text x="72" y="110" fill="white" font-family="Segoe UI, Arial, sans-serif" font-size="28" letter-spacing="3">APPLICATION CASE STUDY</text>
      <foreignObject x="72" y="150" width="930" height="250">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Segoe UI, Arial, sans-serif; font-size: 56px; line-height: 1.08; font-weight: 700; color: white;">
          ${title}
        </div>
      </foreignObject>
      <foreignObject x="72" y="450" width="1000" height="100">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Segoe UI, Arial, sans-serif; font-size: 28px; line-height: 1.4; color: rgba(255,255,255,0.92);">
          ${subline}
        </div>
      </foreignObject>
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