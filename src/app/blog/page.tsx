import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { NewsletterSignupForm } from '@/components/storefront/newsletter-signup-form';
import { JsonLdScript } from '@/components/seo/json-ld';
import { blogCategorySlug } from '@/lib/blog';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import {
  getBlogAuthorById,
  getBlogCatalog,
  getCategoryCounts,
  getMostReadPosts,
  getProductTopicCounts,
  paginateBlogPosts,
  filterBlogPosts,
} from '@/lib/storefront-api';

type BlogPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    page?: string;
  }>;
};

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();

  return buildMetadata({
    title: 'Motion Control Knowledge Center — STEPMOTECH',
    description: 'Engineering guides, application notes, tutorials, and product updates for stepper motors, BLDC, servo, and motion control systems.',
    path: '/blog',
    locale,
  });
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const [{ locale }, params] = await Promise.all([getServerSitePreferences(), searchParams]);
  const { t } = getServerTranslations(locale);
  const catalog = await getBlogCatalog(locale);

  const filters = {
    query: params.q?.trim() || undefined,
    category: params.category?.trim() || undefined,
  };
  const filteredPosts = filterBlogPosts(catalog, filters);
  const pagination = paginateBlogPosts(filteredPosts, Number(params.page) || 1, catalog.pageSize);
  const categoryCounts = getCategoryCounts(catalog);
  const productTopicCounts = getProductTopicCounts(catalog);

  // Featured post: latest published post (only show when no filter is active)
  const isFiltered = Boolean(filters.query || filters.category);
  const featuredPost = !isFiltered && catalog.posts.length > 0 ? catalog.posts[0] : null;
  const displayPosts = featuredPost
    ? pagination.items.filter((post) => post.slug !== featuredPost.slug)
    : pagination.items;

  const mostReadPosts = getMostReadPosts(catalog, 5);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
  ], locale);

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'STEPMOTECH Knowledge Center',
    description: 'Technical guides, application notes, and tutorials for motion control engineering.',
    url: `${SITE_URL}${withLocalePath('/blog', locale)}`,
    inLanguage: locale,
    publisher: {
      '@type': 'Organization',
      name: 'STEPMOTECH',
      url: SITE_URL,
    },
    blogPost: pagination.items.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.seoDescription ?? post.summary,
      inLanguage: post.locale,
      articleSection: post.category,
      keywords: [post.category, ...post.productTopics, post.industry].join(', '),
      url: `${SITE_URL}${withLocalePath(`/blog/${post.slug}`, locale)}`,
      datePublished: post.publishedAt,
    })),
  };

  function buildBlogHref(overrides: { q?: string | null; category?: string | null; page?: string | null }) {
    const query = new URLSearchParams();
    const values = {
      q: overrides.q !== undefined ? overrides.q : params.q,
      category: overrides.category !== undefined ? overrides.category : params.category,
      page: overrides.page !== undefined ? overrides.page : params.page,
    };

    if (values.q) query.set('q', values.q);
    if (values.category) query.set('category', values.category);
    if (values.page && values.page !== '1') query.set('page', values.page);

    const href = withLocalePath('/blog', locale);
    const search = query.toString();
    return search ? `${href}?${search}` : href;
  }

  return (
    <StorefrontFrame>
      <JsonLdScript id="blog-index-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="blog-index-jsonld" data={blogJsonLd} />

      {/* ── Hero ── */}
      <section className="blog-hero">
        <div className="section-inner">
          <span className="blog-hero-eyebrow">{t('blog.knowledgeCenter')}</span>
          <h1 className="blog-hero-title">{t('blog.heroTitle')}</h1>
          <p className="blog-hero-desc">Technical guides, application notes, and field-proven tutorials from the STEPMOTECH engineering team.</p>
          <form action={withLocalePath('/blog', locale)} method="get" className="blog-hero-search">
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ''}
              className="blog-search-input"
              placeholder="Search articles by keyword..."
              aria-label="Search articles"
            />
            {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
            <button type="submit" className="blog-search-btn">Search</button>
          </form>
        </div>
      </section>

      {/* ── Category tabs ── */}
      <nav className="blog-category-tabs">
        <div className="section-inner blog-tabs-inner">
          <Link
            href={buildBlogHref({ category: null, page: '1' })}
            className={`blog-tab${!params.category ? ' is-active' : ''}`}
          >
            {t('blog.allArticles')}
          </Link>
          {categoryCounts.map(({ category, slug, count }) => (
            <Link
              key={slug}
              href={buildBlogHref({ category: slug, page: '1' })}
              className={`blog-tab${params.category === slug ? ' is-active' : ''}`}
            >
              {category}
              <span className="blog-tab-count">{count}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* ── Main content ── */}
      <section className="section">
        <div className="section-inner blog-layout">
          <div className="blog-main">
            {/* Featured post */}
            {featuredPost ? (
              <article className="blog-featured-card">
                <a href={withLocalePath(`/blog/${featuredPost.slug}`, locale)} className="blog-featured-cover-wrap">
                  <img src={withLocalePath(`/blog/cover/${featuredPost.slug}`, locale)} alt={featuredPost.coverAlt} className="blog-featured-cover" />
                </a>
                <div className="blog-featured-body">
                  <div className="blog-card-meta-row">
                    <span className="blog-category-chip">{featuredPost.category}</span>
                    <span className="blog-meta-sep">·</span>
                    <span className="blog-meta-text">{featuredPost.readMinutes} {t('blog.minRead')}</span>
                    <span className="blog-meta-sep">·</span>
                    <span className="blog-meta-text">{new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  <h2 className="blog-featured-title">
                    <Link href={withLocalePath(`/blog/${featuredPost.slug}`, locale)}>{featuredPost.title}</Link>
                  </h2>
                  <p className="blog-featured-summary">{featuredPost.summary}</p>
                  <div className="blog-featured-footer">
                    <span className="blog-author-name">{getBlogAuthorById(catalog, featuredPost.authorId)?.name}</span>
                    <span className="blog-meta-sep">·</span>
                    <span className="blog-meta-text">{featuredPost.industry}</span>
                  </div>
                </div>
              </article>
            ) : null}

            {/* Article grid */}
            <div className="blog-card-grid">
              {displayPosts.map((post) => {
                const author = getBlogAuthorById(catalog, post.authorId);
                return (
                  <article key={post.slug} className="blog-card">
                    <a href={withLocalePath(`/blog/${post.slug}`, locale)} className="blog-card-cover-wrap">
                      <img src={withLocalePath(`/blog/cover/${post.slug}`, locale)} alt={post.coverAlt} className="blog-card-cover" />
                    </a>
                    <div className="blog-card-body">
                      <div className="blog-card-meta-row">
                        <span className="blog-category-chip">{post.category}</span>
                        <span className="blog-meta-text">{post.readMinutes} min</span>
                      </div>
                      <h3 className="blog-card-title">
                        <Link href={withLocalePath(`/blog/${post.slug}`, locale)}>{post.title}</Link>
                      </h3>
                      <p className="blog-card-summary">{post.summary}</p>
                      <div className="blog-card-footer">
                        <span className="blog-author-name">{author?.name}</span>
                        <span className="blog-meta-text">{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {displayPosts.length === 0 ? (
              <div className="blog-empty-state">
                <p>{t('blog.noArticles')}</p>
                <Link href={withLocalePath('/blog', locale)} className="blog-clear-link">Clear filters</Link>
              </div>
            ) : null}

            {/* Pagination */}
            {pagination.totalPages > 1 ? (
              <div className="blog-pagination">
                {Array.from({ length: pagination.totalPages }, (_, index) => {
                  const pageNumber = String(index + 1);
                  const isActive = pagination.page === index + 1;
                  return (
                    <Link
                      key={pageNumber}
                      href={buildBlogHref({ page: pageNumber })}
                      className={`blog-page-btn${isActive ? ' is-active' : ''}`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* ── Sidebar ── */}
          <aside className="blog-sidebar">
            {/* Subscribe */}
            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">{t('blog.subscribe')}</h3>
              <p className="blog-sidebar-text">{t('blog.subscribeDesc')}</p>
              <NewsletterSignupForm placeholder="Work email" buttonLabel="Subscribe" />
            </div>

            {/* Most read */}
            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">{t('blog.mostRead')}</h3>
              <div className="blog-sidebar-list">
                {mostReadPosts.map((post, index) => (
                  <Link key={post.slug} href={withLocalePath(`/blog/${post.slug}`, locale)} className="blog-sidebar-link">
                    <span className="blog-sidebar-rank">{index + 1}</span>
                    <span className="blog-sidebar-link-text">
                      <strong>{post.title}</strong>
                      <span className="blog-meta-text">{post.viewCount.toLocaleString()} reads</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">{t('blog.categories')}</h3>
              <div className="blog-sidebar-list">
                {categoryCounts.map(({ category, slug, count }) => (
                  <Link key={slug} href={buildBlogHref({ category: slug, page: '1' })} className="blog-sidebar-link">
                    <strong>{category}</strong>
                    <span className="blog-meta-text">{count} {t('blog.articles')}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Product Topics */}
            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">{t('blog.byProduct')}</h3>
              <div className="blog-sidebar-list">
                {productTopicCounts.map(({ topic, slug, count }) => (
                  <Link key={slug} href={withLocalePath(`/blog/t/${slug}`, locale)} className="blog-sidebar-link">
                    <strong>{topic}</strong>
                    <span className="blog-meta-text">{count} {t('blog.articles')}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}
