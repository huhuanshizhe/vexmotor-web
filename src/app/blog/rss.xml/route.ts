import { SITE_URL } from '@/lib/site-config';
import { getPublishedBlogPosts } from '@/lib/storefront-api';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];

  try {
    posts = await getPublishedBlogPosts();
  } catch {
    posts = [];
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>STEPMOTECH Engineering Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Engineering articles for motion control teams, OEM buyers, and integration partners.</description>
    ${posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.slug}</link>
      <guid>${SITE_URL}/blog/${post.slug}</guid>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
      <author>${escapeXml(post.author.name ?? 'STEPMOTECH')}</author>
      <description>${escapeXml(post.summary ?? '')}</description>
    </item>`).join('')}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
