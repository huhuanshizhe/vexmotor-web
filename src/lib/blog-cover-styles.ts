export type BlogCoverColors = {
  start: string;
  end: string;
};

export const blogCoverStylePalettes: Record<number, BlogCoverColors> = {
  1: { start: '#153858', end: '#d65b22' },
  2: { start: '#0f5c72', end: '#d65b22' },
  3: { start: '#204b33', end: '#d6a322' },
  4: { start: '#472450', end: '#d65b22' },
  5: { start: '#1a2744', end: '#4a90a4' },
  6: { start: '#2c1810', end: '#c45c26' },
  7: { start: '#1e3a5f', end: '#7c3aed' },
  8: { start: '#0d3b2e', end: '#10b981' },
  9: { start: '#4a1942', end: '#f59e0b' },
  10: { start: '#1f2937', end: '#6366f1' },
};

export function normalizeCoverStyle(value: number | null | undefined): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10) {
    return value;
  }
  return 1;
}

export function getBlogCoverColors(coverStyle: number | null | undefined): BlogCoverColors {
  return blogCoverStylePalettes[normalizeCoverStyle(coverStyle)] ?? blogCoverStylePalettes[1]!;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildBlogCoverBackgroundLayers(colors: BlogCoverColors) {
  return `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
          <stop stop-color="${colors.start}" />
          <stop offset="1" stop-color="${colors.end}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" rx="36" fill="url(#bg)" />
      <circle cx="1020" cy="110" r="180" fill="rgba(255,255,255,0.08)" />
      <circle cx="180" cy="560" r="200" fill="rgba(255,255,255,0.06)" />`;
}

export function buildBlogCoverBackgroundSvg(coverStyle: number | null | undefined) {
  const colors = getBlogCoverColors(coverStyle);

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${buildBlogCoverBackgroundLayers(colors)}
    </svg>
  `;
}

export function buildBlogCoverSvg(input: {
  title: string;
  category: string | null;
  coverStyle: number | null;
}) {
  const colors = getBlogCoverColors(input.coverStyle);
  const title = escapeXml(input.title);
  const meta = escapeXml(input.category ?? 'Engineering Blog');

  return `
    <svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${buildBlogCoverBackgroundLayers(colors)}
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
}
