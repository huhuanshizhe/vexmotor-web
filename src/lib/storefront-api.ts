import { serverFetch } from '@/lib/api-client';
import type { CommerceConfig } from '@/lib/commerce-config';
import type { SiteSettings } from '@/lib/site-settings';
import type { GlossaryTerm, StorefrontFaq, TechFaqCategory, TechFaqEntry } from '@/lib/knowledge';
import type { PressRelease } from '@/lib/press';
import { getLocalSupportCatalog, getSupportPageBySlug as getLocalSupportPageBySlug } from '@/lib/support-content';

import type {
  HomeData,
  NavigationData,
  ProductListResult,
  ProductListSort,
  StorefrontCategory,
  StorefrontProductDetail,
  SupportPage,
} from './storefront-types';

export type {
  HomeData,
  NavigationData,
  ProductListResult,
  ProductListSort,
  StorefrontCategory,
  StorefrontProductCard,
  StorefrontProductDetail,
  StorefrontImage,
  StorefrontLink,
  StorefrontUtilityLink,
  StorefrontAttachment,
  StorefrontCompatibleGroup,
  SupportPage,
} from './storefront-types';

export type SupportCatalog = {
  sourceMode: 'code-seeded' | 'admin-managed';
  pages: SupportPage[];
};

export type KnowledgeCatalog = {
  sourceMode: 'code-seeded' | 'admin-managed';
  glossaryTerms: GlossaryTerm[];
  storefrontFaqs: StorefrontFaq[];
  techFaqCategories: TechFaqCategory[];
  techFaqEntries: TechFaqEntry[];
};

export type PressCatalog = {
  sourceMode: 'code-seeded' | 'admin-managed';
  boilerplate: string;
  mediaKitContents: string[];
  releases: PressRelease[];
};

export type ProductListParams = {
  keyword?: string;
  categorySlug?: string;
  purchaseMode?: 'buy' | 'inquiry';
  page?: number;
  pageSize?: number;
  sort?: ProductListSort;
  inStockOnly?: boolean;
};

function toLocaleHeader(locale?: string) {
  if (!locale) return undefined;
  return locale.length === 2 ? locale : locale;
}

function buildProductListQuery(params: ProductListParams) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.categorySlug) search.set('category', params.categorySlug);
  if (params.purchaseMode) search.set('purchaseMode', params.purchaseMode);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  if (params.sort) search.set('sort', params.sort);
  if (params.inStockOnly) search.set('inStockOnly', 'true');
  return search.toString();
}

export async function getHomeData(): Promise<HomeData> {
  return serverFetch<HomeData>('/api/front/home');
}

export async function getNavigationData(): Promise<NavigationData> {
  return serverFetch<NavigationData>('/api/front/navigation');
}

export async function getCategories(locale?: string): Promise<StorefrontCategory[]> {
  const response = await serverFetch<StorefrontCategory[] | { categories?: StorefrontCategory[] }>(
    '/api/front/categories',
    locale ? { locale } : undefined,
  );
  return Array.isArray(response) ? response : response.categories ?? [];
}

export async function getProductList(params: ProductListParams = {}): Promise<ProductListResult> {
  const query = buildProductListQuery(params);
  const fetchOptions = { cache: 'no-store' as const };

  if (params.keyword) {
    return serverFetch<ProductListResult>(`/api/front/search${query ? `?${query}` : ''}`, fetchOptions);
  }
  if (params.categorySlug) {
    const path = `/api/front/categories/${encodeURIComponent(params.categorySlug)}/products${query ? `?${query}` : ''}`;
    return serverFetch<ProductListResult>(path, fetchOptions);
  }
  return serverFetch<ProductListResult>(`/api/front/products${query ? `?${query}` : ''}`, fetchOptions);
}

export async function getProductBySlug(slug: string): Promise<StorefrontProductDetail | null> {
  try {
    return await serverFetch<StorefrontProductDetail>(`/api/front/products/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function getCommerceConfig(locale?: string): Promise<CommerceConfig> {
  return serverFetch<CommerceConfig>('/api/front/commerce', { locale });
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return serverFetch<SiteSettings>('/api/front/site-settings');
}

export async function getSupportCatalog(): Promise<SupportCatalog> {
  return getLocalSupportCatalog();
}

export async function getSupportPageBySlug(slug: string): Promise<SupportPage | null> {
  return getLocalSupportPageBySlug(slug);
}

export async function getKnowledgeCatalog(): Promise<KnowledgeCatalog> {
  return serverFetch<KnowledgeCatalog>('/api/front/knowledge');
}

export type BoardFaqItem = {
  id: string;
  title: string;
  body: string;
};

export type BoardFaqListResponse = {
  locale: string;
  boardKey: string;
  items: BoardFaqItem[];
};

export async function getBoardFaqs(boardKey: string, locale?: string): Promise<BoardFaqListResponse> {
  return serverFetch<BoardFaqListResponse>(
    `/api/front/boards/${encodeURIComponent(boardKey)}/faqs`,
    { locale: toLocaleHeader(locale) },
  );
}

export type BoardBlogAuthor = {
  name: string | null;
  title: string | null;
  bio: string | null;
};

export type BoardBlogItem = {
  id: string;
  title: string;
  summary: string | null;
  slug: string;
  category: string | null;
  categorySlug: string | null;
  coverStyle: number | null;
  author: BoardBlogAuthor;
  tags: string[];
  publishedAt: string | null;
};

export type BoardBlogListResponse = {
  locale: string;
  boardKey: string;
  items: BoardBlogItem[];
};

export type BlogCategoryItem = {
  label: string;
  slug: string;
};

export type BlogCategoriesResponse = {
  items: BlogCategoryItem[];
};

export type StorefrontBlogDetail = {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  slug: string;
  category: string | null;
  categorySlug: string | null;
  coverStyle: number | null;
  author: BoardBlogAuthor;
  seo: {
    title: string | null;
    description: string | null;
  };
  publishedAt: string | null;
  boardKeys: string[];
  tags: string[];
  relatedProductSlugs: string[];
};

export async function getBoardBlogs(boardKey: string, locale?: string): Promise<BoardBlogListResponse> {
  return serverFetch<BoardBlogListResponse>(
    `/api/front/boards/${encodeURIComponent(boardKey)}/blogs`,
    { locale: toLocaleHeader(locale) },
  );
}

export async function getBlogCategories(): Promise<BlogCategoriesResponse> {
  return serverFetch<BlogCategoriesResponse>('/api/front/blog/categories');
}

export async function getStorefrontBlogDetail(slug: string, locale?: string): Promise<StorefrontBlogDetail | null> {
  try {
    return await serverFetch<StorefrontBlogDetail>(`/api/front/blog/${encodeURIComponent(slug)}`, {
      locale: toLocaleHeader(locale),
    });
  } catch {
    return null;
  }
}

export async function getPublishedBlogPosts(locale = 'en'): Promise<BoardBlogItem[]> {
  const board = await getBoardBlogs('blog', locale);
  return board.items;
}

export async function getBlogPostBySlug(slug: string, locale = 'en'): Promise<StorefrontBlogDetail | null> {
  return getStorefrontBlogDetail(slug, locale);
}

export async function getPressCatalog(locale = 'en'): Promise<PressCatalog> {
  return serverFetch<PressCatalog>('/api/front/press', { locale: toLocaleHeader(locale) });
}

export type CmsPage = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: string | null;
};

export async function getCmsPageByLegacySlug(legacySlug: string, locale = 'en'): Promise<CmsPage | null> {
  try {
    return await serverFetch<CmsPage>(`/api/front/cms/legacy/${encodeURIComponent(legacySlug)}`, { locale: toLocaleHeader(locale) });
  } catch {
    return null;
  }
}
