import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Pagination } from '@C/pagination';
import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { CatalogFilterSidebar, buildPurchaseModeSection } from '@/components/storefront/catalog-filter-sidebar';
import { CatalogProductCard } from '@/components/storefront/catalog-product-card';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { AddToQuoteButton } from '@/components/storefront/add-to-quote-button';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import { AddToWishlistButton } from '@/components/storefront/add-to-wishlist-button';
import { withLocalePath } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import { listShellCatalogCategories, mergeCategoriesWithShell, resolveStorefrontCategory } from '@/lib/catalog-categories';
import { getCategories, getProductList, type ProductListSort } from '@/lib/storefront-api';

// ISR: revalidate category pages every 2 minutes
export const revalidate = 120;

type CategoryPageSearchParams = Promise<{
  keyword?: string;
  page?: string;
  mode?: string;
  purchaseMode?: string;
  sort?: string;
  view?: string;
  pageSize?: string;
  stock?: string;
}>;

function normalizeSort(value: string | undefined): ProductListSort {
  if (value === 'name-asc' || value === 'price-asc' || value === 'price-desc' || value === 'newest') {
    return value;
  }

  return 'featured';
}

function normalizeLocalePath(path: string, locale: Locale) {
  return withLocalePath(path, locale);
}

function readPurchaseMode(value: string | undefined): 'buy' | 'inquiry' | undefined {
  if (value === 'buy' || value === 'inquiry') {
    return value;
  }
  return undefined;
}

export async function generateStaticParams() {
  return listShellCatalogCategories().map((category) => ({ categorySlug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const [{ locale }, { categorySlug }] = await Promise.all([getServerSitePreferences(), params]);
  const apiCategories = await getCategories().catch(() => []);
  const category = resolveStorefrontCategory(categorySlug, apiCategories);

  if (!category) {
    return buildMetadata({
      title: 'Category not found — STEPMOTECH',
      path: '/products',
      locale,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: `${category.name} — STEPMOTECH`,
    description: `${category.description ?? category.name}. ${category.productCount ?? 0} catalog models with datasheets, CAD access, and direct-buy or inquiry workflows.`,
    path: `/c/${category.slug}`,
    locale,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ categorySlug: string }>;
  searchParams: CategoryPageSearchParams;
}) {
  const [{ locale }, routeParams, query] = await Promise.all([getServerSitePreferences(), params, searchParams]);
  const { t } = getServerTranslations(locale);
  const apiCategories = await getCategories().catch(() => []);
  const categories = mergeCategoriesWithShell(apiCategories);
  const selectedCategory = resolveStorefrontCategory(routeParams.categorySlug, apiCategories);

  if (!selectedCategory) {
    notFound();
  }

  const category = selectedCategory;

  const currentPage = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
  const parsedPageSize = Number.parseInt(query.pageSize ?? '24', 10);
  const pageSize = [24, 48, 96].includes(parsedPageSize) ? parsedPageSize : 24;
  const selectedMode = readPurchaseMode(query.purchaseMode ?? query.mode);
  const selectedSort = normalizeSort(query.sort);
  const selectedView = query.view === 'row' ? 'row' : 'grid';
  const inStockOnly = query.stock === 'in-stock';

  function buildCategoryHref(overrides: {
    keyword?: string | null;
    purchaseMode?: 'buy' | 'inquiry' | null;
    sort?: ProductListSort | null;
    view?: 'grid' | 'row' | null;
    page?: number;
    pageSize?: number | null;
    stock?: boolean | null;
  }) {
    const search = new URLSearchParams();
    const keyword = overrides.keyword !== undefined ? overrides.keyword : query.keyword;
    const purchaseMode = overrides.purchaseMode !== undefined ? overrides.purchaseMode : selectedMode;
    const sort = overrides.sort !== undefined ? overrides.sort : selectedSort;
    const view = overrides.view !== undefined ? overrides.view : selectedView;
    const page = overrides.page ?? currentPage;
    const perPage = overrides.pageSize !== undefined ? overrides.pageSize : pageSize;
    const stock = overrides.stock !== undefined ? overrides.stock : inStockOnly;

    if (keyword) {
      search.set('keyword', keyword);
    }

    if (purchaseMode) {
      search.set('purchaseMode', purchaseMode);
    }

    if (sort && sort !== 'featured') {
      search.set('sort', sort);
    }

    if (view && view !== 'grid') {
      search.set('view', view);
    }

    if (perPage && perPage !== 24) {
      search.set('pageSize', String(perPage));
    }

    if (stock) {
      search.set('stock', 'in-stock');
    }

    if (page > 1) {
      search.set('page', String(page));
    }

    const queryString = search.toString();
    return queryString ? `${normalizeLocalePath(`/c/${category.slug}`, locale)}?${queryString}` : normalizeLocalePath(`/c/${category.slug}`, locale);
  }

  const listing = await getProductList({
    categorySlug: category.slug,
    keyword: query.keyword,
    purchaseMode: selectedMode,
    page: currentPage,
    pageSize,
    sort: selectedSort,
    inStockOnly,
  });

  const startPrice = listing.items.reduce<number | null>((lowest, item) => {
    if (item.purchaseMode !== 'buy') {
      return lowest;
    }

    return lowest === null ? item.price.amount : Math.min(lowest, item.price.amount);
  }, null);
  const faqItems = [
    {
      question: t('catalog.faqNarrowQuestion', { category: category.name }),
      answer: t('catalog.faqNarrowAnswer'),
    },
    {
      question: t('catalog.faqCompareQuestion', { category: category.name }),
      answer: t('catalog.faqCompareAnswer'),
    },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: t('catalog.breadcrumbHome'), path: '/' },
      { name: t('catalog.breadcrumbProducts'), path: '/products' },
      { name: category.name, path: `/c/${category.slug}` },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: selectedCategory.name,
    description: selectedCategory.description,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: listing.items.slice(0, 24).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}${normalizeLocalePath(`/products/${item.slug}`, locale)}`,
      })),
    },
  };

  const purchaseModeSection = buildPurchaseModeSection({
    title: t('catalog.purchaseModeLabel'),
    allLabel: t('catalog.all'),
    facets: listing.facets,
    selectedMode,
    buildHref: (purchaseMode) => buildCategoryHref({ purchaseMode, page: 1 }),
  });

  const filterSections = purchaseModeSection ? [purchaseModeSection] : [];

  return (
    <StorefrontFrame>
      <JsonLdScript id="category-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="category-collection-jsonld" data={collectionJsonLd} />

      <section className="section catalog-page-section">
        <div className="section-inner catalog-stack">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href={normalizeLocalePath('/', locale)}>{t('catalog.breadcrumbHome')}</Link>
            <span>/</span>
            <Link href={normalizeLocalePath('/products', locale)}>{t('catalog.breadcrumbProducts')}</Link>
            <span>/</span>
            <span>{selectedCategory.name}</span>
          </nav>

          <article className="info-card category-hero-band">
            <div>
              <div className="card-kicker">{t('catalog.categoryKicker')}</div>
              <h1 className="section-title category-hero-title">{selectedCategory.name}</h1>
              <p className="section-description">{selectedCategory.description ?? t('catalog.heroFallbackDesc')}</p>
            </div>

            <div className="category-kpi-strip">
              <article className="summary-stat">
                <span className="summary-label">{t('catalog.kpiSkus')}</span>
                <strong>{listing.meta.total}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">{t('catalog.kpiFrom')}</span>
                <strong>{startPrice === null ? t('catalog.requestQuote') : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(startPrice)}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">{t('catalog.kpiLeadTime')}</span>
                <strong>{listing.items.some((item) => item.inStock) ? t('catalog.leadTimeInStock') : t('catalog.leadTimeDefault')}</strong>
              </article>
            </div>
          </article>

          <div className="catalog-results-toolbar info-card">
            <div className="catalog-results-toolbar-group">
              <strong className="catalog-toolbar-heading">{t('search.sortLabel')}</strong>
              <div className="filter-chip-list">
                <Link href={buildCategoryHref({ sort: 'featured', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'featured' ? ' is-active' : ''}`}>{t('search.bestseller')}</Link>
                <Link href={buildCategoryHref({ sort: 'price-asc', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'price-asc' ? ' is-active' : ''}`}>{t('search.priceAsc')}</Link>
                <Link href={buildCategoryHref({ sort: 'price-desc', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'price-desc' ? ' is-active' : ''}`}>{t('search.priceDesc')}</Link>
                <Link href={buildCategoryHref({ sort: 'newest', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'newest' ? ' is-active' : ''}`}>{t('search.newest')}</Link>
              </div>
            </div>

            <div className="catalog-results-toolbar-group">
              <strong className="catalog-toolbar-heading">{t('search.viewLabel')}</strong>
              <div className="filter-chip-list">
                <Link href={buildCategoryHref({ view: 'grid' })} className={`filter-chip filter-chip-link${selectedView === 'grid' ? ' is-active' : ''}`}>{t('search.grid')}</Link>
                <Link href={buildCategoryHref({ view: 'row' })} className={`filter-chip filter-chip-link${selectedView === 'row' ? ' is-active' : ''}`}>{t('search.row')}</Link>
                <Link href={buildCategoryHref({ stock: !inStockOnly, page: 1 })} className={`filter-chip filter-chip-link${inStockOnly ? ' is-active' : ''}`}>{t('search.inStockOnly')}</Link>
              </div>
            </div>

            <div className="catalog-results-toolbar-group">
              <strong className="catalog-toolbar-heading">{t('search.perPageLabel')}</strong>
              <div className="filter-chip-list">
                {[24, 48, 96].map((value) => (
                  <Link key={value} href={buildCategoryHref({ pageSize: value, page: 1 })} className={`filter-chip filter-chip-link${pageSize === value ? ' is-active' : ''}`}>
                    {value}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="catalog-page-grid">
            <CatalogFilterSidebar
              panelTitle={t('catalog.filterPanelTitle')}
              searchForm={(
                <form action={normalizeLocalePath(`/c/${selectedCategory.slug}`, locale)} className="search-inline-form catalog-search-form">
                  <input type="hidden" name="sort" value={selectedSort} />
                  <input type="hidden" name="view" value={selectedView} />
                  <input type="hidden" name="pageSize" value={String(pageSize)} />
                  {selectedMode ? <input type="hidden" name="purchaseMode" value={selectedMode} /> : null}
                  {inStockOnly ? <input type="hidden" name="stock" value="in-stock" /> : null}
                  <input name="keyword" defaultValue={query.keyword ?? ''} className="newsletter-input" placeholder={t('catalog.searchWithin', { category: selectedCategory.name })} />
                  <button type="submit" className="button-primary">{t('catalog.apply')}</button>
                </form>
              )}
              sections={filterSections}
            />

            <section className="catalog-stack catalog-results-shell">
              <div className="catalog-results-header">
                <div>
                  <h2 className="section-title catalog-results-title">{selectedCategory.name}</h2>
                  <p className="section-description">{t('catalog.matchingProducts', { count: listing.meta.total })}</p>
                </div>
                <div className="catalog-toolbar-card">
                  <strong>{t('catalog.productsCount', { count: listing.meta.total })}</strong>
                  <span className="section-description compact-copy">{t('catalog.pageOf', { page: listing.meta.page, totalPages: listing.meta.totalPages })}</span>
                </div>
              </div>

              <div className="catalog-meta-row">
                {query.keyword ? <span className="filter-chip">{t('catalog.keywordChip', { keyword: query.keyword })}</span> : null}
                {selectedMode ? <span className="filter-chip">{selectedMode === 'buy' ? t('catalog.modeChipBuy') : t('catalog.modeChipInquiry')}</span> : null}
                {inStockOnly ? <span className="filter-chip">{t('catalog.stockChip')}</span> : null}
                <Link href={normalizeLocalePath(`/c/${selectedCategory.slug}`, locale)} className="section-link">
                  {t('catalog.clearFilters')}
                </Link>
              </div>

              {listing.items.length ? (
                <>
                  {selectedView === 'grid' ? (
                    <div className="product-grid catalog-product-grid">
                      {listing.items.map((product) => (
                        <CatalogProductCard
                          key={product.id}
                          product={product}
                          productHref={normalizeLocalePath(`/products/${product.slug}`, locale)}
                          compareCategoryName={selectedCategory.name}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="catalog-row-list">
                      {listing.items.map((product) => (
                        <article key={product.id} className="catalog-row-card">
                          {product.coverImage ? (
                            <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)} className="catalog-row-media">
                              <Image src={product.coverImage.url} alt={product.coverImage.alt || product.name} fill sizes="(max-width: 820px) 100vw, 220px" unoptimized className="catalog-row-image" />
                            </Link>
                          ) : null}

                          <div className="catalog-row-main">
                            <div className="catalog-row-topline">
                              <span className="product-badge">{product.inStock ? t('catalog.inStock') : t('catalog.leadTimeOnRequest')}</span>
                              <span className="catalog-row-model">{t('catalog.modelSpu', { spu: product.spu })}</span>
                            </div>

                            <h2 className="catalog-row-title">
                              <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)}>{product.name}</Link>
                            </h2>

                            <p className="catalog-row-description">{product.shortDescription ?? t('catalog.rowFallbackDesc')}</p>

                            <div className="catalog-row-footer">
                              <div className="catalog-row-price-block">
                                {product.purchaseMode === 'buy' ? (
                                  <p className="product-price">{product.price.formatted}</p>
                                ) : null}
                                <p className="product-status">{product.inStock ? t('catalog.stockAvailable') : t('catalog.quoteWorkflow')}</p>
                              </div>

                              <div className="catalog-row-buttons">
                                {product.purchaseMode === 'buy' ? (
                                  <AddToCartButton productId={product.id} redirectToCart={false} />
                                ) : (
                                  <AddToQuoteButton
                                    productId={product.id}
                                    name={product.name}
                                    slug={product.slug}
                                    spu={product.spu}
                                    coverImage={product.coverImage ? { url: product.coverImage.url, alt: product.coverImage.alt || product.name } : null}
                                    listUnitPrice={{ amount: product.price.amount, currency: product.price.currency, formatted: product.price.formatted }}
                                    className="button-primary"
                                    label={t('catalog.requestQuote')}
                                  />
                                )}

                                <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)} className="button-secondary catalog-row-secondary">
                                  {t('catalog.viewDetails')}
                                </Link>
                                <AddToCompareButton
                                  item={{
                                    id: product.id,
                                    name: product.name,
                                    slug: product.slug,
                                    spu: product.spu,
                                    priceLabel: product.purchaseMode === 'buy' ? product.price.formatted : t('catalog.requestQuote'),
                                    purchaseMode: product.purchaseMode,
                                    inStock: product.inStock,
                                    shortDescription: product.shortDescription,
                                    categories: [selectedCategory.name],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  <div className="pagination-bar">
                    <p className="section-description">{t('catalog.paginationHint')}</p>
                    <Pagination page={listing.meta.page} totalPages={listing.meta.totalPages} buildHref={(page) => buildCategoryHref({ page })} />
                  </div>
                </>
              ) : (
                <article className="info-card empty-state-card">
                  <h3 style={{ margin: 0 }}>{t('catalog.emptyTitle')}</h3>
                  <p className="section-description">{t('catalog.emptyDesc')}</p>
                  <Link href={normalizeLocalePath(`/c/${selectedCategory.slug}`, locale)} className="section-link">
                    {t('catalog.resetFilters')}
                  </Link>
                </article>
              )}

              <article className="info-card category-seo-card">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">{t('catalog.aboutCategoryTitle', { category: selectedCategory.name })}</h2>
                    <p className="section-description">{selectedCategory.description ?? t('catalog.aboutFallback')}</p>
                  </div>
                </div>

                <div className="category-faq-list">
                  {faqItems.map((item) => (
                    <details key={item.question} className="category-faq-item">
                      <summary>{item.question}</summary>
                      <p className="section-description compact-copy">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </article>
            </section>
          </div>
        </div>
      </section>

    </StorefrontFrame>
  );
}