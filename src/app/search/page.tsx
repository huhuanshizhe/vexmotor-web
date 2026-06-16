import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import { applicationCaseStudies } from '@/lib/applications';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { glossaryTermToPlainText, techFaqEntryToPlainText } from '@/lib/knowledge';
import { getResourceSectionMeta, resourceItems } from '@/lib/resources';
import { buildMetadata } from '@/lib/seo';
import { getPublishedBlogPosts } from '@/lib/storefront-api';
import { getKnowledgeCatalog } from '@/lib/storefront-api';
import { getSupportCatalog } from '@/lib/storefront-api';
import { getCategories, getProductBySlug, getProductList } from '@/lib/storefront-api';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, query: string) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'ig');
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>,
  );
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

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Search results — STEPMOTECH',
  description: 'Search products, support content, technical FAQ answers, glossary terms, applications, blog posts, and documents from one page.',
  path: '/search',
  noIndex: true,
    locale,
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; keyword?: string; page?: string; type?: string }>;
}) {
  const preferences = await getServerSitePreferences();
  const params = await searchParams;
  const query = params.q ?? params.keyword ?? '';
  const selectedType = params.type ?? 'all';
  const page = Number(params.page ?? '1');
  const [categories, listing, blogPosts, knowledgeCatalog, supportCatalog] = await Promise.all([
    getCategories(),
    getProductList({
      keyword: query,
      page: Number.isNaN(page) ? 1 : page,
      pageSize: 12,
    }),
    getPublishedBlogPosts(preferences.locale),
    getKnowledgeCatalog(),
    getSupportCatalog(),
  ]);
  const productDetails = await Promise.all(listing.items.slice(0, 8).map((item) => getProductBySlug(item.slug)));
  const lowerQuery = query.trim().toLowerCase();
  const contentMatches = [
    ...supportCatalog.pages.map((pageItem) => ({
      id: `support-${pageItem.slug}`,
      title: pageItem.title,
      description: pageItem.description,
      href: withLocalePath(`/support/${pageItem.slug}`, preferences.locale),
      meta: 'Support',
      haystack: `${pageItem.title} ${pageItem.description} ${pageItem.sections.flatMap((section) => [section.title, ...(section.paragraphs ?? []), ...(section.bullets ?? [])]).join(' ')}`.toLowerCase(),
    })),
    ...resourceItems.map((item) => ({
      id: `resource-${item.slug}`,
      title: item.title,
      description: item.summary,
      href: withLocalePath(`/resources/${item.section}`, preferences.locale),
      meta: `Resource · ${getResourceSectionMeta(item.section)?.label ?? item.section}`,
      haystack: `${item.title} ${item.summary} ${item.topic} ${item.productLine} ${item.format} ${item.language} ${item.sku ?? ''}`.toLowerCase(),
    })),
    ...blogPosts.map((post) => ({
      id: `blog-${post.slug}`,
      title: post.title,
      description: post.summary,
      href: withLocalePath(`/blog/${post.slug}`, preferences.locale),
      meta: `Blog · ${post.category}`,
      haystack: `${post.title} ${post.summary} ${post.lead} ${post.category} ${post.productTopics.join(' ')} ${post.industry}`.toLowerCase(),
    })),
    ...applicationCaseStudies.map((caseStudy) => ({
      id: `application-${caseStudy.slug}`,
      title: caseStudy.title,
      description: caseStudy.summary,
      href: withLocalePath(`/applications/${caseStudy.slug}`, preferences.locale),
      meta: `Application · ${caseStudy.industryTitle}`,
      haystack: `${caseStudy.title} ${caseStudy.summary} ${caseStudy.resultHeadline} ${caseStudy.industryTitle} ${caseStudy.productLine} ${caseStudy.region}`.toLowerCase(),
    })),
    ...knowledgeCatalog.glossaryTerms.map((term) => ({
      id: `glossary-${term.id}`,
      title: term.term,
      description: term.searchSummary,
      href: `${withLocalePath('/glossary', preferences.locale)}#term-${term.id}`,
      meta: 'Glossary',
      haystack: glossaryTermToPlainText(term).toLowerCase(),
    })),
  ].filter((item) => (lowerQuery ? item.haystack.includes(lowerQuery) : true));
  const resources = contentMatches.slice(0, 8);
  const faqMatches = [
    ...knowledgeCatalog.storefrontFaqs.map((item) => ({
      id: `faq-${item.id}`,
      question: item.question,
      answer: item.answer,
      href: `${withLocalePath('/faq', preferences.locale)}#q-${item.id}`,
      meta: 'Storefront FAQ',
      haystack: `${item.question} ${item.answer}`.toLowerCase(),
    })),
    ...knowledgeCatalog.techFaqEntries.map((entry) => ({
      id: `tech-faq-${entry.id}`,
      question: entry.question,
      answer: entry.searchSummary,
      href: `${withLocalePath('/tech-faq', preferences.locale)}#q-${entry.id}`,
      meta: `Tech FAQ · ${entry.category}`,
      haystack: techFaqEntryToPlainText(entry).toLowerCase(),
    })),
  ].filter((item) => (lowerQuery ? item.haystack.includes(lowerQuery) : true));
  const faqResults = faqMatches.slice(0, 6);
  const documentMatches = productDetails
    .flatMap((product) =>
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
      return `${item.title} ${item.meta} ${item.productName}`.toLowerCase().includes(lowerQuery) || /doc|pdf|datasheet|cad|step|manual/.test(lowerQuery);
    })
  ;
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

  function buildTabHref(type: string) {
    const search = new URLSearchParams();
    if (query) {
      search.set('q', query);
    }
    if (type !== 'all') {
      search.set('type', type);
    }
    return `${withLocalePath('/search', preferences.locale)}${search.toString() ? `?${search.toString()}` : ''}`;
  }

  return (
    <StorefrontFrame
      eyebrow="Search"
      title={`Results for "${query || 'all catalog content'}"`}
      description="Search across catalog products, support pages, resource content, case studies, blog posts, FAQ answers, glossary terms, and downloadable documents from one page."
      actions={
        <form action={withLocalePath('/search', preferences.locale)} className="search-inline-form" role="search">
          <input name="q" defaultValue={query} className="newsletter-input" placeholder="Search by product name, SKU, question, or file" />
          <button type="submit" className="button-primary">
            Search
          </button>
        </form>
      }
    >
      <section className="section">
        <div className="section-inner search-page-stack">
          <div className="section-header">
            <div>
              <h2 className="section-title">Results for "{query || 'all catalog content'}"</h2>
              <p className="section-description" aria-live="polite">{listing.meta.total} products · {contentMatches.length} content results · {faqMatches.length} answers · {documentMatches.length} documents</p>
            </div>
          </div>

          <div className="search-tabs-row">
            {[
              { id: 'all', label: 'All' },
              { id: 'products', label: 'Products' },
              { id: 'resources', label: 'Resources' },
              { id: 'faq', label: 'FAQ' },
              { id: 'docs', label: 'Docs' },
            ].map((tab) => (
              <Link key={tab.id} href={buildTabHref(tab.id)} className={`filter-chip filter-chip-link${selectedType === tab.id ? ' is-active' : ''}`}>
                {tab.label} ({tabCounts[tab.id as keyof typeof tabCounts]})
              </Link>
            ))}
          </div>

          {querySuggestion ? (
            <article className="info-card search-suggestion-card">
              <strong>Did you mean</strong>
              <Link href={`${withLocalePath('/search', preferences.locale)}?q=${encodeURIComponent(querySuggestion)}`} className="section-link">
                {querySuggestion}
              </Link>
            </article>
          ) : null}

          {(selectedType === 'all' || selectedType === 'products') && listing.items.length ? (
            <article className="info-card search-section-card">
              <div className="section-header trade-card-header">
                <div>
                  <h3 className="cart-section-title">Products</h3>
                  <p className="section-description">Catalog hits use a decision-ready row layout with direct add-to-cart or compare actions.</p>
                </div>
                <Link href={`${withLocalePath('/products', preferences.locale)}?keyword=${encodeURIComponent(query)}`} className="section-link">
                  View all in catalog
                </Link>
              </div>

              <div className="search-product-list">
                {listing.items.map((product) => (
                  <article key={product.id} className="search-product-row">
                    <div className="search-product-copy">
                      <div className="product-card-top">
                        <span className="product-badge">{product.purchaseMode === 'buy' ? 'Direct Buy' : 'Inquiry'}</span>
                        <span className="product-status">{product.inStock ? 'In stock' : 'RFQ flow'}</span>
                      </div>
                      <h3>
                        <Link href={withLocalePath(`/products/${product.slug}`, preferences.locale)}>{highlightText(product.name, query)}</Link>
                      </h3>
                      <p className="product-meta">{highlightText(product.sku, query)}</p>
                      <p className="section-description compact-copy">{highlightText(product.shortDescription ?? 'Factory-direct motion product for engineering review.', query)}</p>
                    </div>
                    <div className="search-product-actions">
                      <p className="product-price">{product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote'}</p>
                      {product.purchaseMode === 'buy' ? (
                        <AddToCartButton productId={product.id} redirectToCart={false} />
                      ) : (
                        <Link href={withLocalePath(`/products/${product.slug}`, preferences.locale)} className="button-secondary product-back-link">
                          Open RFQ
                        </Link>
                      )}
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
                          categories: [],
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ) : null}

          {(selectedType === 'all' || selectedType === 'resources') && resources.length ? (
            <article className="info-card search-section-card">
              <div className="section-header trade-card-header">
                <div>
                  <h3 className="cart-section-title">Resources</h3>
                  <p className="section-description">Support pages, resource library items, applications, blog posts, and glossary entries that match the current search phrase.</p>
                </div>
              </div>
              <div className="search-card-grid">
                {resources.map((resource) => (
                  <Link key={resource.id} href={resource.href} className="pdp-doc-card">
                    <span className="pdp-doc-card-meta">{resource.meta}</span>
                    <strong>{highlightText(resource.title, query)}</strong>
                    <p className="section-description compact-copy">{highlightText(resource.description, query)}</p>
                  </Link>
                ))}
              </div>
            </article>
          ) : null}

          {(selectedType === 'all' || selectedType === 'faq') && faqResults.length ? (
            <article className="info-card search-section-card">
              <div className="section-header trade-card-header">
                <div>
                  <h3 className="cart-section-title">FAQ</h3>
                  <p className="section-description">Operational and engineering answers pulled into the same search flow with deep links back to the exact entry.</p>
                </div>
              </div>
              <div className="search-faq-list">
                {faqResults.map((item) => (
                  <article key={item.id} className="category-faq-item pdp-faq-item">
                    <div className="product-card-top">
                      <span className="product-badge">{item.meta}</span>
                      <Link href={item.href} className="section-link">Open</Link>
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
                  <h3 className="cart-section-title">Documents</h3>
                  <p className="section-description">Direct attachment hits and product-linked document surfaces.</p>
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

          {selectedType !== 'all' && !selectedCount ? (
            <article className="info-card empty-state-card search-empty-card">
              <h3 style={{ margin: 0 }}>No {selectedType} results for "{query}".</h3>
              <p className="section-description">Switch tabs, broaden the phrase, or move to a category browse.</p>
              <div className="inline-link-list">
                <Link href={withLocalePath('/products', preferences.locale)} className="section-link">
                  Browse full catalog
                </Link>
                <Link href={withLocalePath('/contact', preferences.locale)} className="section-link">
                  Ask for sourcing help
                </Link>
              </div>
            </article>
          ) : null}

          {!listing.items.length && !resources.length && !faqResults.length && !documents.length ? (
            <article className="info-card empty-state-card search-empty-card">
              <h3 style={{ margin: 0 }}>No matches for "{query}".</h3>
              <p className="section-description">Try broader terminology, switch to a family browse, or start from the selector path.</p>
              <div className="inline-link-list">
                <Link href={withLocalePath('/selector', preferences.locale)} className="section-link">
                  Try Selector Path
                </Link>
                {categories.slice(0, 3).map((category) => (
                  <Link key={category.id} href={withLocalePath(`/c/${category.slug}`, preferences.locale)} className="section-link">
                    {category.name}
                  </Link>
                ))}
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </StorefrontFrame>
  );
}
