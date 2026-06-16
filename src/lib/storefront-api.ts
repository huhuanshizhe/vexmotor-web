import { serverFetch } from '@/lib/api-client';
import type { BlogPost } from '@/lib/blog';
import type { CommerceConfig } from '@/lib/commerce-config';
import type { GlossaryTerm, StorefrontFaq, TechFaqCategory, TechFaqEntry } from '@/lib/knowledge';
import type { PressRelease } from '@/lib/press';

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

export type {
  BlogCatalog,
  BlogFilters,
} from './blog-helpers';

export {
  filterBlogPosts,
  getBlogAuthorById,
  getBlogPostBySlug as findBlogPostInCatalog,
  getBlogYears,
  getCategoryCounts,
  getMostReadPosts,
  getPostsByProductTopic,
  getProductTopicBySlug,
  getProductTopicCounts,
  getRelatedPosts,
  paginateBlogPosts,
} from './blog-helpers';

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

export async function getCategories(): Promise<StorefrontCategory[]> {
  return serverFetch<StorefrontCategory[]>('/api/front/categories');
}

export async function getProductList(params: ProductListParams = {}): Promise<ProductListResult> {
  const query = buildProductListQuery(params);
  if (params.categorySlug) {
    const path = `/api/front/categories/${encodeURIComponent(params.categorySlug)}/products${query ? `?${query}` : ''}`;
    return serverFetch<ProductListResult>(path);
  }
  return serverFetch<ProductListResult>(`/api/front/search${query ? `?${query}` : ''}`);
}

export async function getProductBySlug(slug: string): Promise<StorefrontProductDetail | null> {
  try {
    return await serverFetch<StorefrontProductDetail>(`/api/front/products/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function getCommerceConfig(): Promise<CommerceConfig> {
  return serverFetch<CommerceConfig>('/api/front/commerce');
}

export async function getBlogCatalog(locale = 'en'): Promise<import('./blog-helpers').BlogCatalog> {
  return serverFetch('/api/front/blog', { locale: toLocaleHeader(locale) });
}

export async function getPublishedBlogPosts(locale = 'en') {
  const catalog = await getBlogCatalog(locale);
  return catalog.posts;
}

export async function getBlogPostBySlug(slug: string, locale = 'en'): Promise<BlogPost | null> {
  try {
    return await serverFetch<BlogPost>(`/api/front/blog/${encodeURIComponent(slug)}`, { locale: toLocaleHeader(locale) });
  } catch {
    const catalog = await getBlogCatalog(locale);
    const { getBlogPostBySlug: findInCatalog } = await import('./blog-helpers');
    return findInCatalog(catalog, slug) ?? null;
  }
}

export async function getSupportCatalog(): Promise<SupportCatalog> {
  return serverFetch<SupportCatalog>('/api/front/support');
}

export async function getSupportPageBySlug(slug: string): Promise<SupportPage | null> {
  try {
    return await serverFetch<SupportPage>(`/api/front/support/${encodeURIComponent(slug)}`);
  } catch {
    const catalog = await getSupportCatalog();
    return catalog.pages.find((page) => page.slug === slug) ?? null;
  }
}

export async function getKnowledgeCatalog(): Promise<KnowledgeCatalog> {
  return serverFetch<KnowledgeCatalog>('/api/front/knowledge');
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
