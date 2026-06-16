import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { NewsletterSignupForm } from '@/components/storefront/newsletter-signup-form';
import { JsonLdScript } from '@/components/seo/json-ld';
import { blogProductTopicFromSlug, type BlogProductTopic } from '@/lib/blog';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import { getBlogAuthorById, getBlogCatalog, getPostsByProductTopic, paginateBlogPosts } from '@/lib/storefront-api';

const topicDescriptions: Record<BlogProductTopic, string> = {
  'Stepper Motor': 'Technical guides, selection criteria, and application notes for Nema 8 through Nema 34 stepper motor systems.',
  'BLDC Motor': 'Engineering resources for brushless DC motor commutation, tuning, and integration in precision motion applications.',
  'Servo & Integrated': 'Bandwidth tuning, cable management, and system-level design guidance for servo and integrated motion assemblies.',
  'Drivers & Power': 'Driver configuration, power supply sizing, current-loop tuning, and commissioning best practices.',
};

type TopicPageProps = {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateStaticParams() {
  return Object.values(blogProductTopicFromSlug).map((topic) => ({
    topic: Object.entries(blogProductTopicFromSlug).find(([, v]) => v === topic)?.[0] ?? topic.toLowerCase(),
  }));
}

export async function generateMetadata({ params }: TopicPageProps) {
  const { topic: topicSlug } = await params;
  const topic = blogProductTopicFromSlug[topicSlug];
  const { locale } = await getServerSitePreferences();

  if (!topic) {
    return buildMetadata({ title: 'Blog — STEPMOTECH', description: 'Motion control engineering articles.', path: '/blog', locale });
  }

  return buildMetadata({
    title: `${topic} Articles — STEPMOTECH`,
    description: topicDescriptions[topic],
    path: `/blog/t/${topicSlug}`,
    locale,
  });
}

export default async function BlogTopicPage({ params, searchParams }: TopicPageProps) {
  const [{ topic: topicSlug }, { page: pageParam }, { locale }] = await Promise.all([params, searchParams, getServerSitePreferences()]);
  const { t } = getServerTranslations(locale);
  const topic = blogProductTopicFromSlug[topicSlug];

  if (!topic) {
    return (
      <section className="section">
        <div className="section-inner" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h1>Topic not found</h1>
          <p><Link href={withLocalePath('/blog', locale)} className="section-link">Back to Blog</Link></p>
        </div>
      </section>
    );
  }

  const catalog = await getBlogCatalog(locale);
  const topicPosts = getPostsByProductTopic(catalog, topicSlug);
  const pagination = paginateBlogPosts(topicPosts, Number(pageParam) || 1, catalog.pageSize);
  const description = topicDescriptions[topic];

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: topic, path: `/blog/t/${topicSlug}` },
  ], locale);

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${topic} Articles — STEPMOTECH`,
    description,
    url: `${SITE_URL}${withLocalePath(`/blog/t/${topicSlug}`, locale)}`,
    inLanguage: locale,
    isPartOf: {
      '@type': 'Blog',
      name: 'STEPMOTECH Knowledge Center',
      url: `${SITE_URL}${withLocalePath('/blog', locale)}`,
    },
    numberOfItems: topicPosts.length,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: pagination.items.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}${withLocalePath(`/blog/${post.slug}`, locale)}`,
        name: post.title,
      })),
    },
  };

  function buildTopicHref(pageNum: string) {
    const href = withLocalePath(`/blog/t/${topicSlug}`, locale);
    return pageNum !== '1' ? `${href}?page=${pageNum}` : href;
  }

  return (
    <StorefrontFrame>
      <JsonLdScript id={`blog-topic-${topicSlug}-breadcrumb`} data={breadcrumbJsonLd} />
      <JsonLdScript id={`blog-topic-${topicSlug}-collection`} data={collectionJsonLd} />

      {/* ── Hero ── */}
      <section className="blog-topic-hero">
        <div className="section-inner">
          <div className="blog-topic-breadcrumb">
            <Link href={withLocalePath('/blog', locale)} className="blog-topic-back">← {t('blog.browseArticles')}</Link>
          </div>
          <h1 className="blog-topic-title">{topic} Articles</h1>
          <p className="blog-topic-desc">{description}</p>
          <span className="blog-topic-count">{topicPosts.length} {topicPosts.length === 1 ? t('blog.article') : t('blog.articles')}</span>
        </div>
      </section>

      {/* ── Content ── */}
      <section className="section">
        <div className="section-inner blog-layout">
          <div className="blog-main">
            <div className="blog-card-grid">
              {pagination.items.map((post) => {
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

            {pagination.items.length === 0 ? (
              <div className="blog-empty-state">
                <p>{t('blog.noArticlesTopic')}</p>
                <Link href={withLocalePath('/blog', locale)} className="blog-clear-link">{t('blog.browseAll')}</Link>
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
                      href={buildTopicHref(pageNumber)}
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
            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">{t('blog.subscribe')}</h3>
              <p className="blog-sidebar-text">Get new {topic.toLowerCase()} articles in your inbox.</p>
              <NewsletterSignupForm placeholder="Work email" buttonLabel="Subscribe" />
            </div>

            <div className="blog-sidebar-card">
              <h3 className="blog-sidebar-heading">{t('blog.otherTopics')}</h3>
              <div className="blog-sidebar-list">
                {Object.entries(blogProductTopicFromSlug)
                  .filter(([, topicValue]) => topicValue !== topic)
                  .map(([slug, topicValue]) => (
                    <Link key={slug} href={withLocalePath(`/blog/${slug}`, locale)} className="blog-sidebar-link">
                      <strong>{topicValue}</strong>
                      <span className="blog-meta-text">{catalog.posts.filter((p) => p.productTopics.includes(topicValue)).length} {t('blog.articles')}</span>
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
