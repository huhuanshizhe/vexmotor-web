import { blogPageSize } from '@/lib/blog-taxonomy';
import type { BlogCategoryItem, BoardBlogItem } from '@/lib/storefront-api';

export type BoardBlogFilters = {
  query?: string;
  categorySlug?: string;
};

export function resolveBoardBlogCategorySlug(post: BoardBlogItem): string {
  if (post.categorySlug) return post.categorySlug;
  if (!post.category) return 'uncategorized';

  return post.category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'uncategorized';
}

export function filterBoardBlogPosts(items: BoardBlogItem[], filters: BoardBlogFilters) {
  const query = filters.query?.trim().toLowerCase() ?? '';

  return items.filter((post) => {
    const matchesQuery =
      !query ||
      `${post.title} ${post.summary ?? ''} ${post.category ?? ''} ${post.author.name ?? ''}`.toLowerCase().includes(query);
    const matchesCategory =
      !filters.categorySlug || resolveBoardBlogCategorySlug(post) === filters.categorySlug;

    return matchesQuery && matchesCategory;
  });
}

export function paginateBoardBlogPosts(items: BoardBlogItem[], page: number, pageSize = blogPageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  return {
    page: currentPage,
    totalPages,
    items: items.slice(startIndex, startIndex + pageSize),
  };
}

export function getBoardCategoryCounts(categories: BlogCategoryItem[], items: BoardBlogItem[]) {
  const countBySlug = new Map<string, number>();

  for (const post of items) {
    const slug = resolveBoardBlogCategorySlug(post);
    countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
  }

  return categories.map((category) => ({
    category: category.label,
    slug: category.slug,
    count: countBySlug.get(category.slug) ?? 0,
  }));
}

export function getRecentBoardBlogPosts(items: BoardBlogItem[], limit = 5) {
  return [...items]
    .sort((left, right) => {
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightTime - leftTime || left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

export function formatBoardBlogDate(value: string | null, locale: string, options: Intl.DateTimeFormatOptions) {
  if (!value) return 'Date TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString(locale, options);
}
