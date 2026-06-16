import { NextResponse } from 'next/server';

import { buildSimplePdf } from '@/lib/certifications';
import { getApplicationCaseStudyBySlug } from '@/lib/applications';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const caseStudy = getApplicationCaseStudyBySlug(slug);

  if (!caseStudy) {
    return new NextResponse('Not found', { status: 404 });
  }

  const pdf = buildSimplePdf([
    caseStudy.title,
    '',
    caseStudy.clientLabel,
    caseStudy.industryTitle,
    caseStudy.resultHeadline,
    '',
    'Problem',
    ...caseStudy.problem,
    '',
    'Solution',
    ...caseStudy.solution,
    '',
    'Results',
    ...caseStudy.results,
    '',
    ...caseStudy.kpis.map((item) => `${item.label}: ${item.value}`),
  ]);

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${caseStudy.slug}.pdf"`,
    },
  });
}