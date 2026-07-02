import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { JsonLdScript } from '@/components/seo/json-ld';
import { formatBoardBlogDate } from '@/lib/board-blog-helpers';
import { type Locale, withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import { getBoardBlogs, getProductBySlug, getStorefrontBlogDetail, type StorefrontProductDetail } from '@/lib/storefront-api';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const board = await getBoardBlogs('blog');
    return board.items.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const { locale } = await getServerSitePreferences();
  const post = await getStorefrontBlogDetail(slug, locale);

  if (!post) {
    return buildMetadata({
      title: 'Engineering Blog — STEPMOTECH',
      description: 'Motion control engineering articles.',
      path: '/blog',
      locale,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: post.seo.title ?? `${post.title} — STEPMOTECH`,
    description: post.seo.description ?? post.summary ?? undefined,
    path: `/blog/${post.slug}`,
    locale,
    type: 'article',
    images: [{ url: `/blog/cover/${post.slug}`, alt: post.title }],
  });
}

function BlogProductCard({ product, locale, eyebrow, body }: { product: StorefrontProductDetail; locale: Locale; eyebrow: string; body: string }) {
  return (
    <article className="blog-product-card">
      <div className="blog-product-copy">
        <div className="card-kicker">{eyebrow}</div>
        <h3>
          <Link href={withLocalePath(`/products/${product.slug}`, locale)}>{product.name}</Link>
        </h3>
        <p className="product-meta">{product.spu}</p>
        <p className="section-description compact-copy">{body}</p>
      </div>
      <div className="blog-product-actions">
        <p className="product-price">{product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote'}</p>
        {product.purchaseMode === 'buy' ? (
          <AddToCartButton productId={product.id} redirectToCart={false} />
        ) : (
          <Link href={withLocalePath(`/products/${product.slug}`, locale)} className="button-secondary">Open RFQ</Link>
        )}
      </div>
    </article>
  );
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const [{ locale }, { slug }] = await Promise.all([getServerSitePreferences(), params]);
  const { t } = getServerTranslations(locale);
  const post = await getStorefrontBlogDetail(slug, locale);

  if (!post) {
    notFound();
  }

  const products = await Promise.all(post.relatedProductSlugs.map((productSlug) => getProductBySlug(productSlug)));
  const productMap = new Map(products.filter((item): item is StorefrontProductDetail => Boolean(item)).map((product) => [product.slug, product]));
  const relatedProducts = post.relatedProductSlugs.map((productSlug) => productMap.get(productSlug)).filter((product): product is StorefrontProductDetail => Boolean(product));

  const board = await getBoardBlogs('blog', locale);
  const relatedPosts = board.items.filter((item) => item.slug !== post.slug).slice(0, 2);

  const articleImage = `${SITE_URL}/blog/cover/${post.slug}`;
  const articleUrl = `${SITE_URL}${withLocalePath(`/blog/${post.slug}`, locale)}`;
  const blogUrl = `${SITE_URL}${withLocalePath('/blog', locale)}`;
  const publishedLabel = formatBoardBlogDate(post.publishedAt, locale, { year: 'numeric', month: 'long', day: 'numeric' });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ], locale);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    alternativeHeadline: post.seo.title ?? undefined,
    description: post.seo.description ?? post.summary ?? undefined,
    image: [articleImage],
    inLanguage: locale,
    datePublished: post.publishedAt ?? undefined,
    articleSection: [post.category, ...post.tags].filter(Boolean),
    author: {
      '@type': 'Person',
      name: post.author.name ?? 'STEPMOTECH',
      jobTitle: post.author.title ?? undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'STEPMOTECH',
      url: SITE_URL,
    },
    isPartOf: {
      '@type': 'Blog',
      name: 'STEPMOTECH Knowledge Center',
      url: blogUrl,
    },
    mainEntityOfPage: articleUrl,
  };

  return (
    <StorefrontFrame>
      <JsonLdScript id={`blog-post-${post.slug}-breadcrumb`} data={breadcrumbJsonLd} />
      <JsonLdScript id={`blog-post-${post.slug}-article`} data={articleJsonLd} />

      <section className="blog-post-hero">
        <div className="blog-post-cover-wrap">
          <img
            src={withLocalePath(`/blog/cover/${post.slug}?plain=1`, locale)}
            alt=""
            className="blog-post-cover"
          />
          <div className="blog-post-hero-overlay">
            <div className="section-inner blog-post-hero-shell">
              <div className="blog-post-hero-content">
                <div className="blog-post-hero-meta">
                  <span className="blog-post-eyebrow">Engineering Blog</span>
                  {post.category ? <span className="blog-category-chip blog-category-chip-on-dark">{post.category}</span> : null}
                </div>
                <h1 className="blog-post-title">{post.title}</h1>
                {post.summary ? <p className="blog-post-lead">{post.summary}</p> : null}
                <div className="blog-post-byline">
                  {post.author.name ? <span className="blog-author-name">{post.author.name}</span> : null}
                  {post.author.title ? (
                    <>
                      <span className="blog-meta-sep">·</span>
                      <span className="blog-meta-text">{post.author.title}</span>
                    </>
                  ) : null}
                  {publishedLabel ? (
                    <>
                      <span className="blog-meta-sep">·</span>
                      <span className="blog-meta-text">{publishedLabel}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner blog-post-layout">
          <article className="blog-post-main">
            <div className="blog-html-body" dangerouslySetInnerHTML={{ __html: post.body }} />

            {relatedProducts.length ? (
              <section className="blog-article-section blog-related-section">
                <div className="blog-related-header">
                  <h2>{t('blog.hardwareReferenced')}</h2>
                  <p className="blog-meta-text">Products mentioned or recommended in this article.</p>
                </div>
                <div className="blog-related-product-grid">
                  {relatedProducts.map((product) => (
                    <BlogProductCard
                      key={product.id}
                      product={product}
                      locale={locale}
                      eyebrow="Related product"
                      body={product.shortDescription ?? 'Catalog hardware referenced in this article.'}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {post.author.name ? (
              <section className="blog-author-card">
                <div className="blog-author-info">
                  <div className="blog-author-avatar">{post.author.name.split(' ').map((part) => part[0]).join('')}</div>
                  <div>
                    <p className="blog-author-name-lg">{post.author.name}</p>
                    {post.author.title ? <p className="blog-author-role">{post.author.title} — STEPMOTECH</p> : null}
                  </div>
                </div>
                {post.author.bio ? <p className="blog-author-bio">{post.author.bio}</p> : null}
              </section>
            ) : null}

            {relatedPosts.length ? (
              <section className="blog-article-section blog-related-section">
                <h2>{t('blog.continueReading')}</h2>
                <div className="blog-card-grid blog-related-post-grid">
                  {relatedPosts.map((relatedPost) => (
                    <article key={relatedPost.slug} className="blog-card">
                      <a href={withLocalePath(`/blog/${relatedPost.slug}`, locale)} className="blog-card-cover-wrap">
                        <img src={withLocalePath(`/blog/cover/${relatedPost.slug}`, locale)} alt={relatedPost.title} className="blog-card-cover" />
                      </a>
                      <div className="blog-card-body">
                        <div className="blog-card-meta-row">
                          {relatedPost.category ? <span className="blog-category-chip">{relatedPost.category}</span> : null}
                        </div>
                        <h3 className="blog-card-title">
                          <Link href={withLocalePath(`/blog/${relatedPost.slug}`, locale)}>{relatedPost.title}</Link>
                        </h3>
                        <div className="blog-card-footer">
                          {relatedPost.author.name ? <span className="blog-author-name">{relatedPost.author.name}</span> : null}
                          <Link href={withLocalePath(`/blog/${relatedPost.slug}`, locale)} className="blog-read-link">Read →</Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="blog-cta-card">
              <div>
                <h2>{t('blog.needHelp')}</h2>
                <p className="blog-cta-text">Talk to our engineering team about sizing, integration, or technical requirements. Or subscribe for future articles.</p>
              </div>
              <div className="blog-cta-actions">
                <Link href={withLocalePath('/contact', locale)} className="button-primary">{t('blog.talkToEngineer')}</Link>
                <Link href={withLocalePath('/blog', locale)} className="button-secondary">{t('blog.browseArticles')}</Link>
              </div>
            </section>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
