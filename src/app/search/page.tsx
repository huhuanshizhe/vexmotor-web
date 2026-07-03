import Image from 'next/image';
import Link from 'next/link';

import { Pagination } from '@C/pagination';
import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { AddToQuoteButton } from '@/components/storefront/add-to-quote-button';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import { CatalogFilterSidebar, buildCategorySection, buildPurchaseModeSection } from '@/components/storefront/catalog-filter-sidebar';
import { CatalogProductCard } from '@/components/storefront/catalog-product-card';
import { applicationCaseStudies } from '@/lib/applications';
import { listCatalogSidebarCategories } from '@/lib/catalog-categories';
import { withLocalePath, type Locale } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { glossaryTermToPlainText, techFaqEntryToPlainText } from '@/lib/knowledge';
import { getResourceSectionMeta, resourceItems } from '@/lib/resources';
import { buildMetadata } from '@/lib/seo';
import {
  getCategories,
  getKnowledgeCatalog,
  getProductBySlug,
  getProductList,
  getPublishedBlogPosts,
  getSupportCatalog,
  type ProductListSort,
} from '@/lib/storefront-api';

type SearchPageSearchParams = Promise<{
  q?: string;
  keyword?: string;
  page?: string;
  type?: string;
  sort?: string;
  view?: string;
  pageSize?: string;
  purchaseMode?: string;
  mode?: string;
  category?: string;
  stock?: string;
}>;

function readPurchaseMode(value: string | undefined): 'buy' | 'inquiry' | undefined {
  if (value === 'buy' || value === 'inquiry') {
    return value;
  }
  return undefined;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string | null | undefined, query: string) {
  const safeText = text ?? '';
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return safeText;
  }

  try {
    const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig');
    return safeText.split(pattern).map((part, index) =>
      index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>,
    );
  } catch {
    return safeText;
  }
}

function suggestQuery(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return null;
  }
  if (normalized.includes('nema17')) {
    return query.replace(/nema17/gi, 'Nema 17');
  }
  if (normalized.includes('nema23')) {
    return query.replace(/nema23/gi, 'Nema 23');
  }
  if (normalized.includes('closed loop')) {
    return query.replace(/closed loop/gi, 'closed-loop');
  }
  return null;
}

function normalizeSort(value: string | undefined): ProductListSort {
  if (value === 'name-asc' || value === 'price-asc' || value === 'price-desc' || value === 'newest') {
    return value;
  }
  return 'featured';
}

function normalizeLocalePath(path: string, locale: Locale) {
  return withLocalePath(path, locale);
}

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  const { t } = getServerTranslations(locale);
  return buildMetadata({
    title: t('search.metaTitle'),
    description: t('search.metaDescription'),
    path: '/search',
    noIndex: true,
    locale,
  });
}

export default async function SearchPage({ searchParams }: { searchParams: SearchPageSearchParams }) {
  const preferences = await getServerSitePreferences();
  const params = await searchParams;
  const locale = preferences.locale;
  const { t } = getServerTranslations(locale);
  const query = params.q ?? params.keyword ?? '';
  const selectedType = params.type ?? 'all';
  const currentPage = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const parsedPageSize = Number.parseInt(params.pageSize ?? '24', 10);
  const pageSize = [24, 48, 96].includes(parsedPageSize) ? parsedPageSize : 24;
  const selectedMode = readPurchaseMode(params.purchaseMode ?? params.mode);
  const selectedCategorySlug = params.category?.trim() || undefined;
  const selectedSort = normalizeSort(params.sort);
  const selectedView = params.view === 'row' ? 'row' : 'grid';
  const inStockOnly = params.stock === 'in-stock';
  const showProducts = selectedType === 'all' || selectedType === 'products';

  function buildSearchHref(overrides: {
    q?: string | null;
    type?: string | null;
    purchaseMode?: 'buy' | 'inquiry' | null;
    category?: string | null;
    sort?: ProductListSort | null;
    view?: 'grid' | 'row' | null;
    page?: number;
    pageSize?: number | null;
    stock?: boolean | null;
  }) {
    const search = new URLSearchParams();
    const nextQuery = overrides.q !== undefined ? overrides.q : query;
    const type = overrides.type !== undefined ? overrides.type : selectedType;
    const purchaseMode = overrides.purchaseMode !== undefined ? overrides.purchaseMode : selectedMode;
    const category = overrides.category !== undefined ? overrides.category : selectedCategorySlug;
    const sort = overrides.sort !== undefined ? overrides.sort : selectedSort;
    const view = overrides.view !== undefined ? overrides.view : selectedView;
    const page = overrides.page ?? currentPage;
    const perPage = overrides.pageSize !== undefined ? overrides.pageSize : pageSize;
    const stock = overrides.stock !== undefined ? overrides.stock : inStockOnly;

    if (nextQuery) {
      search.set('q', nextQuery);
    }
    if (type && type !== 'all') {
      search.set('type', type);
    }
    if (purchaseMode) {
      search.set('purchaseMode', purchaseMode);
    }
    if (category) {
      search.set('category', category);
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
    return queryString ? `${normalizeLocalePath('/search', locale)}?${queryString}` : normalizeLocalePath('/search', locale);
  }

  const [apiCategories, listing, blogPosts, knowledgeCatalog, supportCatalog] = await Promise.all([
    getCategories(),
    showProducts
      ? getProductList({
          keyword: query,
          categorySlug: selectedCategorySlug,
          purchaseMode: selectedMode,
          page: currentPage,
          pageSize,
          sort: selectedSort,
          inStockOnly,
        })
      : Promise.resolve({
          items: [],
          facets: [],
          meta: { total: 0, page: 1, pageSize, totalPages: 1 },
        }),
    getPublishedBlogPosts(locale),
    getKnowledgeCatalog(),
    getSupportCatalog(),
  ]);

  const productDetails = showProducts
    ? await Promise.all(listing.items.slice(0, 8).map((item) => getProductBySlug(item.slug)))
    : [];

  const lowerQuery = query.trim().toLowerCase();
  const contentMatches = [
    ...supportCatalog.pages.map((pageItem) => ({
      id: `support-${pageItem.slug}`,
      title: pageItem.title,
      description: pageItem.description,
      href: normalizeLocalePath(`/support/${pageItem.slug}`, locale),
      meta: 'Support',
      haystack: `${pageItem.title} ${pageItem.description} ${pageItem.sections.flatMap((section) => [section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? [])]).join(' ')}`.toLowerCase(),
    })),
    ...resourceItems.map((item) => ({
      id: `resource-${item.slug}`,
      title: item.title,
      description: item.summary,
      href: normalizeLocalePath(`/resources/${item.section}`, locale),
      meta: `Resource · ${getResourceSectionMeta(item.section)?.label ?? item.section}`,
      haystack: `${item.title} ${item.summary} ${item.topic} ${item.productLine} ${item.format} ${item.language} ${item.spu ?? ''}`.toLowerCase(),
    })),
    ...blogPosts.map((post) => ({
      id: `blog-${post.slug}`,
      title: post.title,
      description: post.summary ?? '',
      href: normalizeLocalePath(`/blog/${post.slug}`, locale),
      meta: `Blog · ${post.category ?? 'Article'}`,
      haystack: `${post.title} ${post.summary ?? ''} ${post.category ?? ''} ${post.tags.join(' ')} ${post.author.name ?? ''}`.toLowerCase(),
    })),
    ...applicationCaseStudies.map((caseStudy) => ({
      id: `application-${caseStudy.slug}`,
      title: caseStudy.title,
      description: caseStudy.summary,
      href: normalizeLocalePath(`/applications/${caseStudy.slug}`, locale),
      meta: `Application · ${caseStudy.industryTitle}`,
      haystack: `${caseStudy.title} ${caseStudy.summary} ${caseStudy.resultHeadline} ${caseStudy.industryTitle} ${caseStudy.productLine} ${caseStudy.region}`.toLowerCase(),
    })),
    ...knowledgeCatalog.glossaryTerms.map((term) => ({
      id: `glossary-${term.id}`,
      title: term.term,
      description: term.searchSummary,
      href: `${normalizeLocalePath('/glossary', locale)}#term-${term.id}`,
      meta: 'Glossary',
      haystack: glossaryTermToPlainText(term).toLowerCase(),
    })),
  ].filter((item) => (lowerQuery ? item.haystack.includes(lowerQuery) : true));

  const faqMatches = [
    ...knowledgeCatalog.storefrontFaqs.map((item) => ({
      id: `faq-${item.id}`,
      question: item.question,
      answer: item.answer,
      href: `${normalizeLocalePath('/faq', locale)}#q-${item.id}`,
      meta: 'Storefront FAQ',
      haystack: `${item.question} ${item.answer}`.toLowerCase(),
    })),
    ...knowledgeCatalog.techFaqEntries.map((entry) => ({
      id: `tech-faq-${entry.id}`,
      question: entry.question,
      answer: entry.searchSummary,
      href: `${normalizeLocalePath('/tech-faq', locale)}#q-${entry.id}`,
      meta: `Tech FAQ · ${entry.category}`,
      haystack: techFaqEntryToPlainText(entry).toLowerCase(),
    })),
  ].filter((item) => (lowerQuery ? item.haystack.includes(lowerQuery) : true));

  const documentMatches = productDetails
    .flatMap(
      (product) =>
        product?.attachments.map((attachment) => ({
          id: attachment.id,
          title: attachment.name,
          meta: attachment.mimeType,
          url: attachment.url,
          productName: product.name,
        })) ?? [],
    )
    .filter((item) => {
      if (!lowerQuery) {
        return true;
      }
      return (
        `${item.title} ${item.meta} ${item.productName}`.toLowerCase().includes(lowerQuery)
        || /doc|pdf|datasheet|cad|step|manual/.test(lowerQuery)
      );
    });

  const resources = contentMatches.slice(0, 8);
  const faqResults = faqMatches.slice(0, 6);
  const documents = documentMatches.slice(0, 6);

  const tabCounts = {
    all: listing.meta.total + contentMatches.length + faqMatches.length + documentMatches.length,
    products: listing.meta.total,
    resources: contentMatches.length,
    faq: faqMatches.length,
    docs: documentMatches.length,
  };
  const selectedCount = tabCounts[selectedType as keyof typeof tabCounts] ?? 0;
  const querySuggestion = listing.meta.total || !query ? null : suggestQuery(query);
  const startPrice = listing.items.reduce<number | null>((lowest, item) => {
    if (item.purchaseMode !== 'buy') {
      return lowest;
    }
    return lowest === null ? item.price.amount : Math.min(lowest, item.price.amount);
  }, null);
  const categoryShortcuts = listCatalogSidebarCategories(apiCategories);

  const resultTabs = [
    { id: 'all', label: t('search.tabAll') },
    { id: 'products', label: t('search.tabProducts') },
    { id: 'resources', label: t('search.tabResources') },
    { id: 'faq', label: t('search.tabFaq') },
    { id: 'docs', label: t('search.tabDocs') },
  ] as const;

  const purchaseModeSection = showProducts
    ? buildPurchaseModeSection({
        title: t('search.purchaseModeLabel'),
        allLabel: t('search.all'),
        facets: listing.facets,
        selectedMode,
        buildHref: (purchaseMode) => buildSearchHref({ purchaseMode, page: 1 }),
      })
    : null;

  const categorySection = showProducts && query
    ? buildCategorySection({
        title: t('catalog.sidebarCategories'),
        allLabel: t('search.all'),
        facets: listing.facets,
        shellCategories: categoryShortcuts.map((item) => ({ slug: item.slug, name: item.name })),
        selectedCategorySlug,
        buildHref: (category) => buildSearchHref({ category, page: 1 }),
      })
    : null;

  const filterSections = [
    {
      id: 'result-type',
      title: t('search.resultTypeLabel'),
      defaultOpen: true,
      options: resultTabs.map((tab) => ({
        id: tab.id,
        label: tab.label,
        href: buildSearchHref({ type: tab.id === 'all' ? null : tab.id, page: 1 }),
        active: selectedType === tab.id,
        count: tabCounts[tab.id],
      })),
    },
    ...(purchaseModeSection ? [purchaseModeSection] : []),
    ...(categorySection ? [categorySection] : []),
  ];

  return (
    <StorefrontFrame>
      <section className="section catalog-page-section">
        <div className="section-inner catalog-stack">
          <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
            <Link href={normalizeLocalePath('/', locale)}>{t('navigation.home')}</Link>
            <span>/</span>
            <span>{t('search.breadcrumb')}</span>
          </nav>

          <article className="info-card category-hero-band">
            <div>
              <div className="card-kicker">{t('search.kicker')}</div>
              <h1 className="section-title category-hero-title">
                {query ? t('search.titleWithQuery', { query }) : t('search.titleDefault')}
              </h1>
              <p className="section-description">{t('search.description')}</p>
            </div>

            <div className="category-kpi-strip">
              <article className="summary-stat">
                <span className="summary-label">{t('search.kpiProducts')}</span>
                <strong>{listing.meta.total}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">{t('search.kpiFrom')}</span>
                <strong>{startPrice === null ? t('search.requestQuote') : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(startPrice)}</strong>
              </article>
              <article className="summary-stat">
                <span className="summary-label">{t('search.kpiContentHits')}</span>
                <strong>{contentMatches.length + faqMatches.length + documentMatches.length}</strong>
              </article>
            </div>
          </article>

          {querySuggestion ? (
            <article className="info-card search-suggestion-card">
              <strong>{t('search.didYouMean')}</strong>
              <Link href={buildSearchHref({ q: querySuggestion, page: 1 })} className="section-link">
                {querySuggestion}
              </Link>
            </article>
          ) : null}

          {showProducts ? (
            <div className="catalog-results-toolbar info-card">
              <div className="catalog-results-toolbar-group">
                <strong className="catalog-toolbar-heading">{t('search.sortLabel')}</strong>
                <div className="filter-chip-list">
                  <Link href={buildSearchHref({ sort: 'featured', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'featured' ? ' is-active' : ''}`}>{t('search.bestseller')}</Link>
                  <Link href={buildSearchHref({ sort: 'price-asc', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'price-asc' ? ' is-active' : ''}`}>{t('search.priceAsc')}</Link>
                  <Link href={buildSearchHref({ sort: 'price-desc', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'price-desc' ? ' is-active' : ''}`}>{t('search.priceDesc')}</Link>
                  <Link href={buildSearchHref({ sort: 'newest', page: 1 })} className={`filter-chip filter-chip-link${selectedSort === 'newest' ? ' is-active' : ''}`}>{t('search.newest')}</Link>
                </div>
              </div>

              <div className="catalog-results-toolbar-group">
                <strong className="catalog-toolbar-heading">{t('search.viewLabel')}</strong>
                <div className="filter-chip-list">
                  <Link href={buildSearchHref({ view: 'grid' })} className={`filter-chip filter-chip-link${selectedView === 'grid' ? ' is-active' : ''}`}>{t('search.grid')}</Link>
                  <Link href={buildSearchHref({ view: 'row' })} className={`filter-chip filter-chip-link${selectedView === 'row' ? ' is-active' : ''}`}>{t('search.row')}</Link>
                  <Link href={buildSearchHref({ stock: !inStockOnly, page: 1 })} className={`filter-chip filter-chip-link${inStockOnly ? ' is-active' : ''}`}>{t('search.inStockOnly')}</Link>
                </div>
              </div>

              <div className="catalog-results-toolbar-group">
                <strong className="catalog-toolbar-heading">{t('search.perPageLabel')}</strong>
                <div className="filter-chip-list">
                  {[24, 48, 96].map((value) => (
                    <Link key={value} href={buildSearchHref({ pageSize: value, page: 1 })} className={`filter-chip filter-chip-link${pageSize === value ? ' is-active' : ''}`}>
                      {value}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <div className="catalog-page-grid">
            <CatalogFilterSidebar
              panelTitle={t('search.searchPanelTitle')}
              searchForm={(
                <form action={normalizeLocalePath('/search', locale)} className="search-inline-form catalog-search-form" role="search">
                  <input type="hidden" name="sort" value={selectedSort} />
                  <input type="hidden" name="view" value={selectedView} />
                  <input type="hidden" name="pageSize" value={String(pageSize)} />
                  {selectedType !== 'all' ? <input type="hidden" name="type" value={selectedType} /> : null}
                  {selectedMode ? <input type="hidden" name="purchaseMode" value={selectedMode} /> : null}
                  {selectedCategorySlug ? <input type="hidden" name="category" value={selectedCategorySlug} /> : null}
                  {inStockOnly ? <input type="hidden" name="stock" value="in-stock" /> : null}
                  <input name="q" defaultValue={query} className="newsletter-input" placeholder={t('search.searchPlaceholder')} />
                  <button type="submit" className="button-primary">{t('search.searchButton')}</button>
                </form>
              )}
              sections={filterSections}
            />

            <section className="catalog-stack catalog-results-shell">
              {showProducts ? (
                <>
                  <div className="catalog-results-header">
                    <div>
                      <h2 className="section-title catalog-results-title">{t('search.productMatchesTitle')}</h2>
                      <p className="section-description">
                        {query
                          ? t('search.productMatchesDesc', { count: listing.meta.total, query })
                          : t('search.productMatchesDescAll', { count: listing.meta.total })}
                      </p>
                    </div>
                    <div className="catalog-toolbar-card">
                      <strong>{t('search.productsCount', { count: listing.meta.total })}</strong>
                      <span className="section-description compact-copy">
                        {t('search.pageOf', { page: listing.meta.page, totalPages: listing.meta.totalPages })}
                      </span>
                    </div>
                  </div>

                  <div className="catalog-meta-row">
                    {query ? <span className="filter-chip">{t('search.queryChip', { query })}</span> : null}
                    {selectedMode ? <span className="filter-chip">{selectedMode === 'buy' ? t('search.modeChipBuy') : t('search.modeChipInquiry')}</span> : null}
                    {selectedCategorySlug ? (
                      <span className="filter-chip">
                        {categoryShortcuts.find((item) => item.slug === selectedCategorySlug)?.name ?? selectedCategorySlug}
                      </span>
                    ) : null}
                    {inStockOnly ? <span className="filter-chip">{t('search.stockChip')}</span> : null}
                    <Link href={buildSearchHref({ q: null, purchaseMode: null, category: null, stock: false, page: 1 })} className="section-link">
                      {t('search.clearFilters')}
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
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="catalog-row-list">
                          {listing.items.map((product) => (
                            <article key={product.id} className="catalog-row-card">
                              {product.coverImage ? (
                                <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)} className="catalog-row-media">
                                  <Image
                                    src={product.coverImage.url}
                                    alt={product.coverImage.alt || product.name}
                                    fill
                                    sizes="(max-width: 820px) 100vw, 220px"
                                    unoptimized
                                    className="catalog-row-image"
                                  />
                                </Link>
                              ) : null}

                              <div className="catalog-row-main">
                                <div className="catalog-row-topline">
                                  <span className="product-badge">{product.inStock ? t('catalog.inStock') : t('search.leadTimeOnRequest')}</span>
                                  <span className="catalog-row-model">{t('product.spu')} {highlightText(product.spu, query)}</span>
                                </div>

                                <h2 className="catalog-row-title">
                                  <Link href={normalizeLocalePath(`/products/${product.slug}`, locale)}>{highlightText(product.name, query)}</Link>
                                </h2>

                                <p className="catalog-row-description">
                                  {highlightText(product.shortDescription ?? t('search.factoryDirectFallback'), query)}
                                </p>

                                <div className="catalog-row-footer">
                                  <div className="catalog-row-price-block">
                                    {product.purchaseMode === 'buy' ? (
                                      <p className="product-price">{product.price.formatted}</p>
                                    ) : null}
                                    <p className="product-status">
                                      {product.inStock ? t('search.stockAvailable') : t('search.quoteWorkflow')}
                                    </p>
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
                                      {t('search.viewDetails')}
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
                                        categories: [],
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
                        <p className="section-description">{t('search.paginationHint')}</p>
                        <Pagination page={listing.meta.page} totalPages={listing.meta.totalPages} buildHref={(page) => buildSearchHref({ page })} />
                      </div>
                    </>
                  ) : (
                    <article className="info-card empty-state-card">
                      <h3 style={{ margin: 0 }}>{t('search.noProductsTitle')}</h3>
                      <p className="section-description">{t('search.noProductsDesc')}</p>
                      <div className="inline-link-list">
                        <Link href={buildSearchHref({ q: null, purchaseMode: null, category: null, stock: false, page: 1 })} className="section-link">
                          {t('search.clearFilters')}
                        </Link>
                        <Link href={normalizeLocalePath('/selector', locale)} className="section-link">
                          {t('search.trySelector')}
                        </Link>
                      </div>
                    </article>
                  )}
                </>
              ) : null}

              {(selectedType === 'all' || selectedType === 'resources') && resources.length ? (
                <article className="info-card search-section-card">
                  <div className="section-header trade-card-header">
                    <div>
                      <h3 className="cart-section-title">{t('search.resourcesTitle')}</h3>
                      <p className="section-description">{t('search.resourcesDesc')}</p>
                    </div>
                  </div>
                  <div className="search-card-grid">
                    {resources.map((resource) => (
                      <Link key={resource.id} href={resource.href} className="pdp-doc-card">
                        <span className="pdp-doc-card-meta">{resource.meta}</span>
                        <strong>{highlightText(resource.title, query)}</strong>
                        <p className="section-description compact-copy">{highlightText(resource.description ?? '', query)}</p>
                      </Link>
                    ))}
                  </div>
                </article>
              ) : null}

              {(selectedType === 'all' || selectedType === 'faq') && faqResults.length ? (
                <article className="info-card search-section-card">
                  <div className="section-header trade-card-header">
                    <div>
                      <h3 className="cart-section-title">{t('search.faqTitle')}</h3>
                      <p className="section-description">{t('search.faqDesc')}</p>
                    </div>
                  </div>
                  <div className="search-faq-list">
                    {faqResults.map((item) => (
                      <article key={item.id} className="category-faq-item pdp-faq-item">
                        <div className="product-card-top">
                          <span className="product-badge">{item.meta}</span>
                          <Link href={item.href} className="section-link">{t('search.openLink')}</Link>
                        </div>
                        <strong>
                          <Link href={item.href}>{highlightText(item.question, query)}</Link>
                        </strong>
                        <p className="section-description compact-copy">{highlightText(item.answer, query)}</p>
                      </article>
                    ))}
                  </div>
                </article>
              ) : null}

              {(selectedType === 'all' || selectedType === 'docs') && documents.length ? (
                <article className="info-card search-section-card">
                  <div className="section-header trade-card-header">
                    <div>
                      <h3 className="cart-section-title">{t('search.docsTitle')}</h3>
                      <p className="section-description">{t('search.docsDesc')}</p>
                    </div>
                  </div>
                  <div className="search-card-grid">
                    {documents.map((item) => (
                      <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="pdp-doc-card">
                        <span className="pdp-doc-card-meta">{item.meta}</span>
                        <strong>{highlightText(item.title, query)}</strong>
                        <p className="section-description compact-copy">{highlightText(item.productName, query)}</p>
                      </a>
                    ))}
                  </div>
                </article>
              ) : null}

              {selectedType !== 'all' && selectedType !== 'products' && !selectedCount ? (
                <article className="info-card empty-state-card search-empty-card">
                  <h3 style={{ margin: 0 }}>{t('search.noTypeResults', { type: selectedType, query })}</h3>
                  <p className="section-description">{t('search.noTypeResultsDesc')}</p>
                  <div className="inline-link-list">
                    <Link href={buildSearchHref({ type: null, page: 1 })} className="section-link">
                      {t('search.showAllResults')}
                    </Link>
                    <Link href={normalizeLocalePath('/products', locale)} className="section-link">
                      {t('search.browseCatalog')}
                    </Link>
                  </div>
                </article>
              ) : null}

              {selectedType === 'all' && !listing.items.length && !resources.length && !faqResults.length && !documents.length ? (
                <article className="info-card empty-state-card search-empty-card">
                  <h3 style={{ margin: 0 }}>{t('search.noMatchesTitle', { query })}</h3>
                  <p className="section-description">{t('search.noMatchesDesc')}</p>
                  <div className="inline-link-list">
                    <Link href={normalizeLocalePath('/selector', locale)} className="section-link">
                      {t('search.trySelector')}
                    </Link>
                    {categoryShortcuts.map((category) => (
                      <Link key={category.id} href={normalizeLocalePath(`/c/${category.slug}`, locale)} className="section-link">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </article>
              ) : null}
            </section>
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}
