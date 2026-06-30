import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { Pagination } from '@C/pagination';
import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { CatalogProductCard } from '@/components/storefront/catalog-product-card';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import { AddToWishlistButton } from '@/components/storefront/add-to-wishlist-button';
import { withLocalePath } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { listShellCatalogCategories, mergeCategoriesWithShell, resolveStorefrontCategory } from '@/lib/catalog-categories';
import { getCategories, getProductList, type ProductListSort } from '@/lib/storefront-api';

// ISR: revalidate category pages every 2 minutes
export const revalidate = 120;

type CategoryPageSearchParams = Promise<{
  keyword?: string;
  page?: string;
  mode?: string;
  sort?: string;
  view?: string;
  pageSize?: string;
  stock?: string;
  compare?: string;
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
  const selectedMode = query.mode === 'buy' || query.mode === 'inquiry' ? query.mode : undefined;
  const selectedSort = normalizeSort(query.sort);
  const selectedView = query.view === 'row' ? 'row' : 'grid';
  const inStockOnly = query.stock === 'in-stock';
  const compareMode = query.compare === '1';

  function buildCategoryHref(overrides: {
    keyword?: string | null;
    mode?: 'buy' | 'inquiry' | null;
    sort?: ProductListSort | null;
    view?: 'grid' | 'row' | null;
    page?: number;
    pageSize?: number | null;
    stock?: boolean | null;
    compare?: boolean | null;
  }) {
    const search = new URLSearchParams();
    const keyword = overrides.keyword !== undefined ? overrides.keyword : query.keyword;
    const mode = overrides.mode !== undefined ? overrides.mode : selectedMode;
    const sort = overrides.sort !== undefined ? overrides.sort : selectedSort;
    const view = overrides.view !== undefined ? overrides.view : selectedView;
    const page = overrides.page ?? currentPage;
    const perPage = overrides.pageSize !== undefined ? overrides.pageSize : pageSize;
    const stock = overrides.stock !== undefined ? overrides.stock : inStockOnly;
    const compare = overrides.compare !== undefined ? overrides.compare : compareMode;

    if (keyword) {
      search.set('keyword', keyword);
    }

    if (mode) {
      search.set('mode', mode);
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

    if (compare) {
      search.set('compare', '1');
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
  const relatedCategories = categories.filter((item) => item.slug !== category.slug).slice(0, 6);
  const faqItems = [
    {
      question: `How do I narrow ${category.name} by stock and purchase mode?`,
      answer: 'Use the toolbar and left-side chips to combine in-stock-only with direct-buy or inquiry models, then share the resulting URL with your team.',
    },
    {
      question: `Can I compare ${category.name} SKUs before ordering?`,
      answer: 'Yes. Add up to four SKUs to the compare drawer and open the compare page when you are ready for side-by-side review.',
    },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
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
        url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4000'}${normalizeLocalePath(`/products/${item.slug}`, locale)}`,
      })),
    },
  };

  return (
    <StorefrontFrame>
      <JsonLdScript id="category-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="category-collection-jsonld" data={collectionJsonLd} />

      <section className="section catalog-page-section">
        <div className="section-inner catalog-stack">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href={normalizeLocalePath('/', locale)}>Home</Link>
            <span>/</span>
            <Link href={normalizeLocalePath('/products', locale)}>Products</Link>
            <span>/</span>
            <span>{selectedCategory.name}</span>
          </nav>

          <article className="info-card category-hero-band">
            <div>
              <div className="card-kicker">Category</div>
              <h1 className="section-title category-hero-title">{selectedCategory.name}</h1>
              <p className="section-description">{selectedCategory.description ?? 'Engineering-grade product family with direct-buy and RFQ support.'}</p>
            </div>

            <div className="category-kpi-strip">
              <article className="summary-stat">
                <span className="summary-label">SKUs</span>
                <strong>{listing.meta.total}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">From</span>
                <strong>{startPrice === null ? 'Request quote' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(startPrice)}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">Lead time</span>
                <strong>{listing.items.some((item) => item.inStock) ? 'Ships today to 5 business days' : '3 to 15 business days'}</strong>
              </article>
            </div>
          </article>

          <div className="catalog-related-chip-row">
            <span className="summary-label">Related families</span>
            <div className="filter-chip-list">
              {relatedCategories.map((item) => (
                <Link key={item.slug} href={normalizeLocalePath(`/c/${item.slug}`, locale)} className="filter-chip filter-chip-link">
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="catalog-results-toolbar info-card">
            <div className="catalog-results-toolbar-group">
              <strong className="catalog-toolbar-heading">Controls</strong>
              <div className="filter-chip-list">
                <Link href={buildCategoryHref({ sort: 'featured', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'featured' ? ' is-active' : ''}`}>Bestseller</Link>
                <Link href={buildCategoryHref({ sort: 'price-asc', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'price-asc' ? ' is-active' : ''}`}>Price asc</Link>
                <Link href={buildCategoryHref({ sort: 'price-desc', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'price-desc' ? ' is-active' : ''}`}>Price desc</Link>
                <Link href={buildCategoryHref({ sort: 'newest', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'newest' ? ' is-active' : ''}`}>Newest</Link>
              </div>
            </div>

            <div className="catalog-results-toolbar-group">
              <strong className="catalog-toolbar-heading">View</strong>
              <div className="filter-chip-list">
                <Link href={buildCategoryHref({ view: 'grid' })} className={`filter-chip filter-chip-link${selectedView === 'grid' ? ' is-active' : ''}`}>Grid</Link>
                <Link href={buildCategoryHref({ view: 'row' })} className={`filter-chip filter-chip-link${selectedView === 'row' ? ' is-active' : ''}`}>Row</Link>
                <Link href={buildCategoryHref({ stock: !inStockOnly, page: 1 })} className={`filter-chip filter-chip-link${inStockOnly ? ' is-active' : ''}`}>In stock only</Link>
                <Link href={buildCategoryHref({ compare: !compareMode })} className={`filter-chip filter-chip-link${compareMode ? ' is-active' : ''}`}>Compare mode</Link>
              </div>
            </div>

            <div className="catalog-results-toolbar-group">
              <strong className="catalog-toolbar-heading">Per page</strong>
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
            <aside className="info-card catalog-sidebar catalog-filter-card">
              <div className="catalog-filter-group">
                <h2 className="catalog-filter-title">Filter panel</h2>
                <form action={normalizeLocalePath(`/c/${selectedCategory.slug}`, locale)} className="search-inline-form catalog-search-form">
                  <input type="hidden" name="sort" value={selectedSort} />
                  <input type="hidden" name="view" value={selectedView} />
                  <input type="hidden" name="pageSize" value={String(pageSize)} />
                  {selectedMode ? <input type="hidden" name="mode" value={selectedMode} /> : null}
                  {inStockOnly ? <input type="hidden" name="stock" value="in-stock" /> : null}
                  {compareMode ? <input type="hidden" name="compare" value="1" /> : null}
                  <input name="keyword" defaultValue={query.keyword ?? ''} className="newsletter-input" placeholder={`Search within ${selectedCategory.name}`} />
                  <button type="submit" className="button-primary">Apply</button>
                </form>
              </div>

              <div className="catalog-filter-group">
                <h3 className="catalog-filter-subtitle">Purchase mode</h3>
                <div className="filter-chip-list">
                  <Link href={buildCategoryHref({ mode: null, page: 1 })} className={`filter-chip filter-chip-link${!selectedMode ? ' is-active' : ''}`}>All</Link>
                  {listing.facets.flatMap((facet) =>
                    facet.options.map((option) => (
                      <Link key={`${facet.key}-${option.value}`} href={buildCategoryHref({ mode: selectedMode === option.value ? null : (option.value as 'buy' | 'inquiry'), page: 1 })} className={`filter-chip filter-chip-link${selectedMode === option.value ? ' is-active' : ''}`}>
                        {option.label} · {option.count}
                      </Link>
                    )),
                  )}
                </div>
              </div>

              <div className="catalog-filter-group">
                <h3 className="catalog-filter-subtitle">Family shortcuts</h3>
                <div className="inline-link-list">
                  {relatedCategories.map((item) => (
                    <Link key={item.slug} href={normalizeLocalePath(`/c/${item.slug}`, locale)} className="sidebar-link">
                      <span>{item.name}</span>
                      <span className="card-kicker">{item.productCount ?? 0}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>

            <section className="catalog-stack catalog-results-shell">
              <div className="catalog-results-header">
                <div>
                  <h2 className="section-title catalog-results-title">{selectedCategory.name}</h2>
                  <p className="section-description">{listing.meta.total} matching products. Filters and toolbar state stay encoded in the URL for team sharing.</p>
                </div>
                <div className="catalog-toolbar-card">
                  <strong>{listing.meta.total} products</strong>
                  <span className="section-description compact-copy">Page {listing.meta.page} of {listing.meta.totalPages}</span>
                </div>
              </div>

              <div className="catalog-meta-row">
                {query.keyword ? <span className="filter-chip">Keyword: {query.keyword}</span> : null}
                {selectedMode ? <span className="filter-chip">Mode: {selectedMode === 'buy' ? 'Direct Buy' : 'Inquiry'}</span> : null}
                {inStockOnly ? <span className="filter-chip">Stock: In stock only</span> : null}
                <Link href={normalizeLocalePath(`/c/${selectedCategory.slug}`, locale)} className="section-link">
                  Clear filters
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
                              <span className="product-badge">{product.inStock ? 'In Stock' : 'Lead time on request'}</span>
                              <span className="catalog-row-model">Model: {product.sku}</span>
                            </div>

                            <h2 className="catalog-row-title">
                              <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)}>{product.name}</Link>
                            </h2>

                            <p className="catalog-row-description">{product.shortDescription ?? 'Factory-direct motion product with configurable specification support.'}</p>

                            <div className="catalog-row-footer">
                              <div className="catalog-row-price-block">
                                <p className="product-price">{product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote'}</p>
                                <p className="product-status">{product.inStock ? 'Stock available for standard orders' : 'Quote-based sourcing workflow'}</p>
                              </div>

                              <div className="catalog-row-buttons">
                                {product.purchaseMode === 'buy' ? (
                                  <AddToCartButton productId={product.id} redirectToCart={false} />
                                ) : (
                                  <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)} className="button-primary">
                                    Request Quote
                                  </Link>
                                )}

                                <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)} className="button-secondary catalog-row-secondary">
                                  View Details
                                </Link>
                                <AddToCompareButton
                                  item={{
                                    id: product.id,
                                    name: product.name,
                                    slug: product.slug,
                                    sku: product.sku,
                                    priceLabel: product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote',
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
                    <p className="section-description">Switch page sizes or continue paging while preserving the active filter set.</p>
                    <Pagination page={listing.meta.page} totalPages={listing.meta.totalPages} buildHref={(page) => buildCategoryHref({ page })} />
                  </div>
                </>
              ) : (
                <article className="info-card empty-state-card">
                  <h3 style={{ margin: 0 }}>No SKUs match this combination.</h3>
                  <p className="section-description">Try widening the keyword, clearing stock-only, or switching back to all purchase modes.</p>
                  <Link href={normalizeLocalePath(`/c/${selectedCategory.slug}`, locale)} className="section-link">
                    Reset filters
                  </Link>
                </article>
              )}

              <article className="info-card category-seo-card">
                <div className="section-header">
                  <div>
                    <h2 className="section-title">About {selectedCategory.name}</h2>
                    <p className="section-description">{selectedCategory.description ?? 'This category groups engineering-grade components suitable for repeatable production workflows, CAD-backed validation, and mixed direct-buy or RFQ procurement.'}</p>
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