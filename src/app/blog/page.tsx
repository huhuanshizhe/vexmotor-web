import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { NewsletterSignupForm } from '@/components/storefront/newsletter-signup-form';
import { JsonLdScript } from '@/components/seo/json-ld';
import {
  filterBoardBlogPosts,
  formatBoardBlogDate,
  getBoardCategoryCounts,
  getRecentBoardBlogPosts,
  paginateBoardBlogPosts,
} from '@/lib/board-blog-helpers';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import { getBoardBlogs, getBlogCategories } from '@/lib/storefront-api';

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
  const [blogBoard, blogCategories] = await Promise.all([
    getBoardBlogs('blog', locale),
    getBlogCategories(),
  ]);
  const items = blogBoard.items;

  const filters = {
    query: params.q?.trim() || undefined,
    categorySlug: params.category?.trim() || undefined,
  };
  const filteredPosts = filterBoardBlogPosts(items, filters);
  const pagination = paginateBoardBlogPosts(filteredPosts, Number(params.page) || 1);
  const categoryCounts = getBoardCategoryCounts(blogCategories.items, items);

  const isFiltered = Boolean(filters.query || filters.categorySlug);
  const featuredPost = !isFiltered && items.length > 0 ? items[0] : null;
  const displayPosts = featuredPost
    ? pagination.items.filter((post) => post.slug !== featuredPost.slug)
    : pagination.items;

  const recentPosts = getRecentBoardBlogPosts(items, 5);

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
      description: post.summary ?? '',
      inLanguage: locale,
      articleSection: post.category ?? undefined,
      keywords: post.category ?? undefined,
      url: `${SITE_URL}${withLocalePath(`/blog/${post.slug}`, locale)}`,
      datePublished: post.publishedAt ?? undefined,
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

      <section className="section">
        <div className="section-inner blog-layout">
          <div className="blog-main">
            {featuredPost ? (
              <article className="blog-featured-card">
                <a href={withLocalePath(`/blog/${featuredPost.slug}`, locale)} className="blog-featured-cover-wrap">
                  <img
                    src={withLocalePath(`/blog/cover/${featuredPost.slug}`, locale)}
                    alt={featuredPost.title}
                    className="blog-featured-cover"
                  />
                </a>
                <div className="blog-featured-body">
                  <div className="blog-card-meta-row">
                    {featuredPost.category ? <span className="blog-category-chip">{featuredPost.category}</span> : null}
                    {featuredPost.publishedAt ? (
                      <>
                        {featuredPost.category ? <span className="blog-meta-sep">·</span> : null}
                        <span className="blog-meta-text">
                          {formatBoardBlogDate(featuredPost.publishedAt, locale, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <h2 className="blog-featured-title">
                    <Link href={withLocalePath(`/blog/${featuredPost.slug}`, locale)}>{featuredPost.title}</Link>
                  </h2>
                  {featuredPost.summary ? <p className="blog-featured-summary">{featuredPost.summary}</p> : null}
                  {featuredPost.author.name ? (
                    <div className="blog-featured-footer">
                      <span className="blog-author-name">{featuredPost.author.name}</span>
                      {featuredPost.author.title ?? featuredPost.category ? (
                        <>
                          <span className="blog-meta-sep">·</span>
                          <span>{featuredPost.author.title ?? featuredPost.category}</span>
                        </>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ) : null}

            <div className="blog-card-grid">
              {displayPosts.map((post) => (
                <article key={post.slug} className="blog-card">
                  <a href={withLocalePath(`/blog/${post.slug}`, locale)} className="blog-card-cover-wrap">
                    <img
                      src={withLocalePath(`/blog/cover/${post.slug}`, locale)}
                      alt={post.title}
                      className="blog-card-cover"
                    />
                  </a>
                  <div className="blog-card-body">
                    <div className="blog-card-meta-row">
                      {post.category ? <span className="blog-category-chip">{post.category}</span> : null}
                    </div>
                    <h3 className="blog-card-title">
                      <Link href={withLocalePath(`/blog/${post.slug}`, locale)}>{post.title}</Link>
                    </h3>
                    {post.summary ? <p className="blog-card-summary">{post.summary}</p> : null}
                    <div className="blog-card-footer">
                      {post.author.name ? <span className="blog-author-name">{post.author.name}</span> : null}
                      {post.publishedAt ? (
                        <span className="blog-meta-text">
                          {formatBoardBlogDate(post.publishedAt, locale, { month: 'short', day: 'numeric' })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {displayPosts.length === 0 ? (
              <div className="blog-empty-state">
                <p>{t('blog.noArticles')}</p>
                <Link href={withLocalePath('/blog', locale)} className="blog-clear-link">Clear filters</Link>
              </div>
            ) : null}

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

          <aside className="blog-sidebar">
            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">{t('blog.subscribe')}</h3>
              <p className="blog-sidebar-text">{t('blog.subscribeDesc')}</p>
              <NewsletterSignupForm placeholder="Work email" buttonLabel="Subscribe" />
            </div>

            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">Recent Posts</h3>
              <div className="blog-sidebar-list">
                {recentPosts.map((post, index) => (
                  <Link key={post.slug} href={withLocalePath(`/blog/${post.slug}`, locale)} className="blog-sidebar-link">
                    <span className="blog-sidebar-rank">{index + 1}</span>
                    <span className="blog-sidebar-link-text">
                      <strong>{post.title}</strong>
                      {post.publishedAt ? (
                        <span className="blog-meta-text">
                          {formatBoardBlogDate(post.publishedAt, locale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

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
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}
