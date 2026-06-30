import Image from 'next/image';
import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { CatalogProductCard } from '@/components/storefront/catalog-product-card';
import { NewsletterSignupForm } from '@/components/storefront/newsletter-signup-form';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildMetadata, buildWebsiteJsonLd } from '@/lib/seo';
import { solutionIndustries } from '@/lib/solutions';
import { getBoardBlogs } from '@/lib/storefront-api';
import { getRecentBoardBlogPosts } from '@/lib/board-blog-helpers';
import { homeShopByCategories } from '@/lib/site-shell';
import { getHomeData, getProductList } from '@/lib/storefront-api';

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'STEPMOTECH — Precision Stepper, BLDC & Servo Motors',
  description:
    'Engineering-grade motion components. CAD, datasheets, tiered pricing. Ships worldwide from US/EU/CN warehouses.',
  path: '/',
    locale,
  });
}

// Revalidate homepage every 60 seconds (ISR)
export const revalidate = 60;

const heroTrustStats = [
  { value: '10,000+', label: 'SKUs in catalog' },
  { value: '3', label: 'Global warehouses' },
  { value: '24h', label: 'Dispatch on stock' },
  { value: 'CE / UL / RoHS', label: 'Certified components' },
];

const whyHighlights = [
  {
    title: 'In-house manufacturing',
    description: 'Self-owned brand and factory control over motors, drivers, gearboxes, and matched motion kits.',
  },
  {
    title: '24h dispatch from US/EU',
    description: 'Stocked catalog items ship fast from multiple regional warehouses with export-ready packaging.',
  },
  {
    title: 'Engineering support',
    description: 'Application engineers help with sizing, spec confirmation, and post-order follow-up.',
  },
  {
    title: 'Tiered & contract pricing',
    description: 'Published volume breaks plus contract lanes for annual programs and OEM demand.',
  },
];

const engineeringResources = [
  { label: 'CAD Library', href: '/resources' },
  { label: 'Datasheet Library', href: '/resources' },
  { label: 'Tech FAQ', href: '/tech-faq' },
  { label: 'Glossary', href: '/glossary' },
  { label: 'Wiring Diagrams', href: '/resources' },
];

function formatPublishedDate(value: string, formatter: Intl.DateTimeFormat) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date TBD' : formatter.format(date);
}

export default async function HomePage() {
  const preferences = await getServerSitePreferences();
  const locale = preferences.locale;

  const [homeData, featuredResult, blogBoard] = await Promise.all([
    getHomeData(),
    getProductList({ purchaseMode: 'buy', pageSize: 8, sort: 'featured' }),
    getBoardBlogs('blog', locale),
  ]);

  const categoryTiles = homeShopByCategories;
  const featuredIndustries = solutionIndustries.slice(0, 6);
  const featuredProducts = featuredResult.items.slice(0, 8);
  const latestArticles = getRecentBoardBlogPosts(blogBoard.items, 4);
  const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <StorefrontFrame>
      <JsonLdScript id="website-jsonld" data={buildWebsiteJsonLd()} />

      {/* 2. Hero */}
      <section className="section hero-section">
        <div className="section-inner">
          <article className="hero-panel home-hero-panel">
            <div className="hero-copy">
              <span className="eyebrow">Precision motion, ready to ship</span>
              <h1 className="hero-title">Engineering-grade motion. Ready to ship worldwide.</h1>
              <p className="hero-description">
                Stepper, BLDC, and servo motors with drivers, gearboxes, and matched kits — backed by CAD,
                datasheets, tiered pricing, and engineering support from a single self-owned brand.
              </p>
              <div className="hero-actions">
                <Link href={withLocalePath('/products', locale)} className="button-primary">
                  Browse Catalog
                </Link>
                <Link href={withLocalePath('/selector', locale)} className="button-secondary">
                  Run Selector
                </Link>
              </div>
              <dl className="hero-trust-grid">
                {heroTrustStats.map((stat) => (
                  <div key={stat.label} className="hero-trust-item">
                    <dt className="hero-trust-value">{stat.value}</dt>
                    <dd className="hero-trust-label">{stat.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="hero-media home-hero-media">
              <Image
                src="https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&w=900&q=80"
                alt="Stepper, BLDC and servo motors"
                width={520}
                height={420}
                sizes="(max-width: 768px) 100vw, 420px"
                unoptimized
                className="home-hero-image"
                priority
              />
            </div>
          </article>
        </div>
      </section>

      {/* 3. Shop by Category 三排六列 */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Shop by Category</h2>
              <p className="section-description">Jump straight into the motion category you are sourcing.</p>
            </div>
            <Link href={withLocalePath('/products', locale)} className="section-link">
              View all categories
            </Link>
          </div>

          <ul className="home-category-grid-18">
            {categoryTiles.map((category) => (
              <li key={category.slug}>
                <Link href={withLocalePath(`/c/${category.slug}`, locale)} className="home-category-card">
                  <div className="home-category-image">
                    <Image
                      src={`/categories/${category.slug}.png`}
                      alt={category.name}
                      width={200}
                      height={200}
                      sizes="(max-width: 768px) 150px, 200px"
                      unoptimized
                    />
                  </div>
                  <span className="home-category-name">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Selector CTA 带 */}
      <section className="section">
        <div className="section-inner">
          <div className="home-selector-strip">
            <div>
              <strong>Not sure which motor?</strong>
              <span>Use our 5-step Selector to match torque, frame, voltage, and feedback to your application.</span>
            </div>
            <Link href={withLocalePath('/selector', locale)} className="button-primary">
              Run Selector
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Solutions by Industry */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Solutions by Industry</h2>
              <p className="section-description">Application-led motion stacks mapped to selector, catalog, and RFQ handoff.</p>
            </div>
            <Link href={withLocalePath('/solutions', locale)} className="section-link">
              All solutions
            </Link>
          </div>

          <div className="home-solutions-grid">
            {featuredIndustries.map((industry) => (
              <Link key={industry.slug} href={withLocalePath(`/solutions/${industry.slug}`, locale)} className="home-solution-card">
                <span className="card-kicker">Industry</span>
                <h3>{industry.title}</h3>
                <p className="section-description compact-copy">{industry.summary}</p>
                <span className="section-link">Explore solution</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Featured / Best-sellers */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured products</h2>
              <p className="section-description">Direct-buy best sellers ready for checkout, tier pricing, and fast dispatch.</p>
            </div>
            <Link href={withLocalePath('/products', locale)} className="section-link">
              Browse catalog
            </Link>
          </div>

          <div className="home-featured-grid">
            {featuredProducts.map((product) => (
              <CatalogProductCard
                key={product.id}
                product={product}
                productHref={withLocalePath(`/products/${product.slug}`, locale)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Why STEPMOTECH */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Why STEPMOTECH</h2>
              <p className="section-description">A single source for engineered motion, fast fulfillment, and commercial flexibility.</p>
            </div>
          </div>

          <div className="home-why-grid">
            {whyHighlights.map((item) => (
              <article key={item.title} className="home-why-card">
                <h3>{item.title}</h3>
                <p className="section-description compact-copy">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Trust Strip */}
      <section className="section">
        <div className="section-inner">
          <div className="home-trust-strip">
            {homeData.trustHighlights.map((item) => (
              <article key={item.title} className="home-trust-item">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Latest Application / Case Studies */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">Latest applications</h2>
              <p className="section-description">Recent motion programs across packaging, robotics, and medical builds.</p>
            </div>
            <Link href={withLocalePath('/applications', locale)} className="section-link">
              All case studies
            </Link>
          </div>

          <div className="home-case-grid">
            {featuredIndustries.slice(0, 3).map((industry) => {
              const caseStudy = industry.caseStudies[0];
              return (
                <article key={industry.slug} className="home-case-card">
                  <span className="card-kicker">{industry.title}</span>
                  <h3>{caseStudy ? caseStudy.title : industry.title}</h3>
                  <p className="section-description compact-copy">{caseStudy ? caseStudy.summary : industry.summary}</p>
                  <Link href={withLocalePath(`/solutions/${industry.slug}`, locale)} className="section-link">
                    Read more
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. From the Resources Hub */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">From the Resources Hub</h2>
              <p className="section-description">Latest engineering articles, sizing guidance, and commissioning notes.</p>
            </div>
            <Link href={withLocalePath('/blog', locale)} className="section-link">
              Visit the blog
            </Link>
          </div>

          <div className="home-resource-grid">
            {latestArticles.map((article) => (
              <article key={article.slug} className="home-resource-card">
                <span className="card-kicker">{article.category}</span>
                <h3>
                  <Link href={withLocalePath(`/blog/${article.slug}`, locale)}>{article.title}</Link>
                </h3>
                <p className="section-description compact-copy">{article.summary ?? ''}</p>
                <p className="product-meta">{article.publishedAt ? formatPublishedDate(article.publishedAt, dateFormatter) : 'Date TBD'}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Engineering Resources strip */}
      <section className="section">
        <div className="section-inner">
          <div className="home-eng-strip">
            <strong className="home-eng-strip-title">Engineering resources</strong>
            <div className="home-eng-strip-links">
              {engineeringResources.map((resource) => (
                <Link key={resource.label} href={withLocalePath(resource.href, locale)} className="filter-chip filter-chip-link">
                  {resource.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 12. Newsletter */}
      <section className="section">
        <div className="section-inner">
          <article className="newsletter-card home-newsletter-card">
            <div className="footer-newsletter-copy">
              <h2 className="section-title">{homeData.newsletter.title}</h2>
              <p className="section-description">{homeData.newsletter.description}</p>
              <p className="product-meta">
                By subscribing you agree to our{' '}
                <Link href={withLocalePath('/legal/privacy', locale)} className="section-link">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <NewsletterSignupForm placeholder={homeData.newsletter.placeholder} buttonLabel={homeData.newsletter.buttonLabel} />
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
