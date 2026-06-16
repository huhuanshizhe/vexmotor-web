import { SITE_URL } from '@/lib/site-config';
import { getBlogAuthorById, getBlogCatalog } from '@/lib/storefront-api';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const catalog = await getBlogCatalog();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>STEPMOTECH Engineering Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Engineering articles for motion control teams, OEM buyers, and integration partners.</description>
    ${catalog.posts.map((post) => {
      const author = getBlogAuthorById(catalog, post.authorId);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid>${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>${escapeXml(author?.name ?? 'STEPMOTECH')}</author>
      <description>${escapeXml(post.seoDescription ?? post.summary)}</description>
    </item>`;
    }).join('')}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}