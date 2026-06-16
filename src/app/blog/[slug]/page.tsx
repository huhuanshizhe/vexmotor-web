import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { JsonLdScript } from '@/components/seo/json-ld';
import { blogProductTopicSlug } from '@/lib/blog';
import { type Locale, withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-config';
import { getBlogAuthorById, getBlogCatalog, findBlogPostInCatalog, getRelatedPosts } from '@/lib/storefront-api';
import { getProductBySlug, type StorefrontProductDetail } from '@/lib/storefront-api';

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const catalog = await getBlogCatalog();
    return catalog.posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const { locale } = await getServerSitePreferences();
  const catalog = await getBlogCatalog(locale);
  const post = findBlogPostInCatalog(catalog, slug);

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
    title: post.seoTitle ?? `${post.title} — STEPMOTECH`,
    description: post.seoDescription ?? post.summary,
    path: `/blog/${post.slug}`,
    locale,
    type: 'article',
    images: [{ url: `/blog/cover/${post.slug}`, alt: post.coverAlt }],
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
        <p className="product-meta">{product.sku}</p>
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
  const catalog = await getBlogCatalog(locale);
  const post = findBlogPostInCatalog(catalog, slug);

  if (!post) {
    notFound();
  }

  const author = getBlogAuthorById(catalog, post.authorId);

  // Collect product slugs from sections (only from inline 'product' block types, not the old fixed section)
  const inlineProductSlugs = post.sections
    .flatMap((section) => section.blocks.filter((block) => block.type === 'product').map((block) => (block as { type: 'product'; productSlug: string }).productSlug));
  const allProductSlugs = Array.from(new Set(post.relatedProductSlugs.concat(inlineProductSlugs)));
  const products = await Promise.all(allProductSlugs.map((productSlug) => getProductBySlug(productSlug)));
  const productMap = new Map(products.filter((item): item is StorefrontProductDetail => Boolean(item)).map((product) => [product.slug, product]));

  const relatedPosts = getRelatedPosts(catalog, post);
  const relatedProducts = post.relatedProductSlugs.map((productSlug) => productMap.get(productSlug)).filter((product): product is StorefrontProductDetail => Boolean(product));

  const articleImage = `${SITE_URL}/blog/cover/${post.slug}`;
  const articleUrl = `${SITE_URL}${withLocalePath(`/blog/${post.slug}`, locale)}`;
  const blogUrl = `${SITE_URL}${withLocalePath('/blog', locale)}`;

  // Build breadcrumb: Home > Blog > [Primary Product Topic] > Article Title
  const primaryTopicSlug = post.productTopics.length > 0
    ? blogProductTopicSlug[post.productTopics[0]]
    : null;

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
    ...(primaryTopicSlug ? [{ name: post.productTopics[0], path: `/blog/t/${primaryTopicSlug}` }] : []),
    { name: post.title, path: `/blog/${post.slug}` },
  ];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems, locale);

  const articleKeywords = Array.from(new Set([post.category, ...post.productTopics, post.industry, ...relatedProducts.map((product) => product.name)])).slice(0, 10);
  const articleAbout = [
    { '@type': 'Thing', name: post.category },
    ...post.productTopics.map((topic) => ({ '@type': 'Thing', name: topic })),
    { '@type': 'Thing', name: post.industry },
    ...relatedProducts.map((product) => ({
      '@type': 'Product',
      name: product.name,
      sku: product.sku,
      url: `${SITE_URL}${withLocalePath(`/products/${product.slug}`, locale)}`,
    })),
  ];

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    alternativeHeadline: post.seoTitle ?? undefined,
    description: post.seoDescription ?? post.summary,
    image: [articleImage],
    inLanguage: post.locale,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    articleSection: [post.category, ...post.productTopics],
    keywords: articleKeywords.join(', '),
    author: {
      '@type': 'Person',
      name: author?.name ?? 'STEPMOTECH',
      jobTitle: author?.role ?? undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'STEPMOTECH',
      url: SITE_URL,
      slogan: 'Factory Direct Motion Components',
    },
    isPartOf: {
      '@type': 'Blog',
      name: 'STEPMOTECH Knowledge Center',
      url: blogUrl,
    },
    about: articleAbout,
    mainEntityOfPage: articleUrl,
  };

  return (
    <StorefrontFrame>
      <JsonLdScript id={`blog-post-${post.slug}-breadcrumb`} data={breadcrumbJsonLd} />
      <JsonLdScript id={`blog-post-${post.slug}-article`} data={articleJsonLd} />

      {/* ── Hero ── */}
      <section className="blog-post-hero">
        <div className="blog-post-cover-wrap">
          <img src={withLocalePath(`/blog/cover/${post.slug}`, locale)} alt={post.coverAlt} className="blog-post-cover" />
        </div>
        <div className="section-inner blog-post-hero-inner">
          <div className="blog-post-meta-row">
            <span className="blog-category-chip">{post.category}</span>
            {post.productTopics.map((topic) => (
              <Link
                key={topic}
                href={withLocalePath(`/blog/t/${blogProductTopicSlug[topic]}`, locale)}
                className="blog-topic-link"
              >
                {topic}
              </Link>
            ))}
          </div>
          <h1 className="blog-post-title">{post.title}</h1>
          <p className="blog-post-lead">{post.lead}</p>
          <div className="blog-post-byline">
            <span className="blog-author-name">{author?.name}</span>
            <span className="blog-meta-sep">·</span>
            <span className="blog-meta-text">{author?.role}</span>
            <span className="blog-meta-sep">·</span>
            <span className="blog-meta-text">{post.readMinutes} min read</span>
            <span className="blog-meta-sep">·</span>
            <span className="blog-meta-text">{new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </section>

      {/* ── Article body ── */}
      <section className="section">
        <div className="section-inner blog-post-layout">
          <article className="blog-post-main">
            {post.sections.map((section) => (
              <section key={section.id} id={section.id} className="blog-article-section">
                <h2>{section.title}</h2>
                {section.blocks.map((block, index) => {
                  if (block.type === 'paragraph') {
                    return <p key={`${section.id}-${index}`}>{block.text}</p>;
                  }

                  if (block.type === 'list') {
                    return (
                      <ul key={`${section.id}-${index}`} className="blog-article-list">
                        {block.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    );
                  }

                  if (block.type === 'code') {
                    return (
                      <pre key={`${section.id}-${index}`} className="blog-code-block">
                        <code>{block.code}</code>
                      </pre>
                    );
                  }

                  if (block.type === 'table') {
                    return (
                      <div key={`${section.id}-${index}`} className="blog-table-wrap">
                        <p className="blog-table-caption">{block.caption}</p>
                        <table className="blog-article-table">
                          <thead>
                            <tr>
                              {block.columns.map((column) => <th key={column}>{column}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {block.rows.map((row) => (
                              <tr key={row.join('-')}>
                                {row.map((cell) => <td key={cell}>{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  // Inline product block — render only if the product exists
                  if (block.type === 'product') {
                    const product = productMap.get(block.productSlug);
                    return product ? (
                      <BlogProductCard key={`${section.id}-${index}`} product={product} locale={locale} eyebrow={block.eyebrow} body={block.body} />
                    ) : null;
                  }

                  return null;
                })}
              </section>
            ))}

            {/* ── Related products (natural, at the end) ── */}
            {relatedProducts.length ? (
              <section className="blog-article-section blog-related-section">
                <div className="blog-related-header">
                  <h2>{t('blog.hardwareReferenced')}</h2>
                  <p className="blog-meta-text">Products mentioned or recommended in the article body.</p>
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

            {/* ── Author card (E-E-A-T) ── */}
            {author ? (
              <section className="blog-author-card">
                <div className="blog-author-info">
                  <div className="blog-author-avatar">{author.name.split(' ').map((n) => n[0]).join('')}</div>
                  <div>
                    <p className="blog-author-name-lg">{author.name}</p>
                    <p className="blog-author-role">{author.role} — STEPMOTECH</p>
                  </div>
                </div>
                <p className="blog-author-bio">{author.bio}</p>
              </section>
            ) : null}

            {/* ── Related posts ── */}
            {relatedPosts.length ? (
              <section className="blog-article-section blog-related-section">
                <h2>{t('blog.continueReading')}</h2>
                <div className="blog-card-grid blog-related-post-grid">
                  {relatedPosts.map((relatedPost) => {
                    const relatedAuthor = getBlogAuthorById(catalog, relatedPost.authorId);
                    return (
                      <article key={relatedPost.slug} className="blog-card">
                        <a href={withLocalePath(`/blog/${relatedPost.slug}`, locale)} className="blog-card-cover-wrap">
                          <img src={withLocalePath(`/blog/cover/${relatedPost.slug}`, locale)} alt={relatedPost.coverAlt} className="blog-card-cover" />
                        </a>
                        <div className="blog-card-body">
                          <div className="blog-card-meta-row">
                            <span className="blog-category-chip">{relatedPost.category}</span>
                            <span className="blog-meta-text">{relatedPost.readMinutes} min</span>
                          </div>
                          <h3 className="blog-card-title">
                            <Link href={withLocalePath(`/blog/${relatedPost.slug}`, locale)}>{relatedPost.title}</Link>
                          </h3>
                          <div className="blog-card-footer">
                            <span className="blog-author-name">{relatedAuthor?.name}</span>
                            <Link href={withLocalePath(`/blog/${relatedPost.slug}`, locale)} className="blog-read-link">Read →</Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {/* ── CTA ── */}
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

          {/* ── Table of contents ── */}
          <aside className="blog-post-toc">
            <div className="blog-toc-card">
              <h4 className="blog-toc-heading">{t('blog.onThisPage')}</h4>
              <nav className="blog-toc-list" aria-label="Table of contents">
                {post.sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`} className="blog-toc-link">{section.title}</a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </section>
    </StorefrontFrame>
  );
}
