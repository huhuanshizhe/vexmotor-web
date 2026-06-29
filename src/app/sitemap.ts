import type { MetadataRoute } from 'next';

import { applicationCaseStudies } from '@/lib/applications';
import { careerRoles } from '@/lib/careers';
import { SUPPORTED_LOCALES, withLocalePath } from '@/lib/i18n';
import { legalPages } from '@/lib/legal-content';
import { resourceSections } from '@/lib/resources';
import { SITE_URL } from '@/lib/site-config';
import { getPublishedBlogPosts, getSupportCatalog, getCategories, getProductList } from '@/lib/storefront-api';

export const dynamic = 'force-dynamic';

function toAbsoluteUrl(pathname: string) {
  return new URL(pathname, SITE_URL).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let products: Awaited<ReturnType<typeof getProductList>> = { items: [], meta: { page: 1, pageSize: 0, total: 0, totalPages: 0 }, facets: [] };
  let blogPosts: Awaited<ReturnType<typeof getPublishedBlogPosts>> = [];
  let supportCatalog: Awaited<ReturnType<typeof getSupportCatalog>> = { sourceMode: 'code-seeded', pages: [] };

  try {
    [categories, products, blogPosts, supportCatalog] = await Promise.all([
      getCategories(),
      getProductList({ page: 1, pageSize: 1000 }),
      getPublishedBlogPosts(),
      getSupportCatalog(),
    ]);
  } catch {
    // Admin API may be unavailable during CI build; static routes still emit.
  }

  const staticRoutes = [
    '/',
    '/products',
    '/support',
    '/solutions',
    '/selector',
    '/custom',
    '/volume-pricing',
    '/contact',
    '/faq',
    '/tech-faq',
    '/glossary',
    '/company/about',
    '/company/certifications',
    '/company/factory',
    '/company/distributors',
    '/company/careers',
    '/company/offices',
    '/company/press',
    '/applications',
    '/blog',
    '/resources',
    ...resourceSections.map((section) => `/resources/${section.slug}`),
  ];

  // Helper function to create multilingual sitemap entries
  const createMultilingualEntry = (path: string, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'], priority: number) => {
    const entries: MetadataRoute.Sitemap = [];
    
    // Add entry for each supported locale
    SUPPORTED_LOCALES.forEach((locale) => {
      const localizedPath = withLocalePath(path, locale);
      const url = toAbsoluteUrl(localizedPath);
      
      entries.push({
        url,
        changeFrequency,
        priority,
        // Add alternate URLs for hreflang
        alternates: {
          languages: Object.fromEntries(
            SUPPORTED_LOCALES.map((altLocale) => [
              altLocale,
              toAbsoluteUrl(withLocalePath(path, altLocale)),
            ])
          ),
        },
      });
    });
    
    return entries;
  };

  return [
    // Static routes with multilingual support
    ...staticRoutes.flatMap((path) => 
      createMultilingualEntry(path, path === '/' ? 'daily' : 'weekly', path === '/' ? 1 : 0.7)
    ),
    ...careerRoles.flatMap((role) =>
      createMultilingualEntry(`/company/careers/${role.slug}`, 'weekly', 0.6)
    ),
    ...blogPosts.flatMap((post) =>
      createMultilingualEntry(`/blog/${post.slug}`, 'weekly', 0.6)
    ),
    ...applicationCaseStudies.flatMap((caseStudy) =>
      createMultilingualEntry(`/applications/${caseStudy.slug}`, 'weekly', 0.6)
    ),
    ...supportCatalog.pages.flatMap((page) =>
      createMultilingualEntry(`/support/${page.slug}`, 'monthly', 0.5)
    ),
    ...legalPages.flatMap((page) =>
      createMultilingualEntry(`/legal/${page.slug}`, 'yearly', 0.4)
    ),
    // Categories with multilingual support
    ...categories.flatMap((category) => 
      createMultilingualEntry(`/c/${category.slug}`, 'weekly', 0.8)
    ),
    // Products with multilingual support
    ...products.items.flatMap((product) => 
      createMultilingualEntry(`/products/${product.slug}`, 'weekly', 0.8)
    ),
  ];
}