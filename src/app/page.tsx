import Image from 'next/image';
import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { CatalogProductCard } from '@/components/storefront/catalog-product-card';
import { NewsletterSignupForm } from '@/components/storefront/newsletter-signup-form';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences, getServerTranslations } from '@/lib/i18n-server';
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

function formatPublishedDate(value: string, formatter: Intl.DateTimeFormat, dateTbdLabel: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? dateTbdLabel : formatter.format(date);
}

export default async function HomePage() {
  const preferences = await getServerSitePreferences();
  const locale = preferences.locale;
  const { t } = getServerTranslations(locale);

  const heroTrustStats = [
    { value: '10,000+', label: t('home.heroStatSkus') },
    { value: '3', label: t('home.heroStatWarehouses') },
    { value: '24h', label: t('home.heroStatDispatch') },
    { value: 'CE / UL / RoHS', label: t('home.heroStatCertified') },
  ];

  const whyHighlights = [
    { title: t('home.whyManufacturingTitle'), description: t('home.whyManufacturingDesc') },
    { title: t('home.whyDispatchTitle'), description: t('home.whyDispatchDesc') },
    { title: t('home.whyEngineeringTitle'), description: t('home.whyEngineeringDesc') },
    { title: t('home.whyPricingTitle'), description: t('home.whyPricingDesc') },
  ];

  const engineeringResources = [
    { label: t('home.cadLibrary'), href: '/resources' },
    { label: t('home.datasheetLibrary'), href: '/resources' },
    { label: t('home.techFaq'), href: '/tech-faq' },
    { label: t('home.glossary'), href: '/glossary' },
    { label: t('home.wiringDiagrams'), href: '/resources' },
  ];

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
              <span className="eyebrow">{t('home.heroEyebrow')}</span>
              <h1 className="hero-title">{t('home.heroTitle')}</h1>
              <p className="hero-description">{t('home.heroDescription')}</p>
              <div className="hero-actions">
                <Link href={withLocalePath('/products', locale)} className="button-primary">
                  {t('home.browseCatalog')}
                </Link>
                <Link href={withLocalePath('/selector', locale)} className="button-secondary">
                  {t('home.runSelector')}
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
              <h2 className="section-title">{t('home.shopByCategoryTitle')}</h2>
              <p className="section-description">{t('home.shopByCategoryDesc')}</p>
            </div>
            <Link href={withLocalePath('/products', locale)} className="section-link">
              {t('home.viewAllCategories')}
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
              <strong>{t('home.selectorStripTitle')}</strong>
              <span>{t('home.selectorStripDesc')}</span>
            </div>
            <Link href={withLocalePath('/selector', locale)} className="button-primary">
              {t('home.runSelector')}
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Solutions by Industry */}
      <section className="section">
        <div className="section-inner">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t('home.solutionsTitle')}</h2>
              <p className="section-description">{t('home.solutionsDesc')}</p>
            </div>
            <Link href={withLocalePath('/solutions', locale)} className="section-link">
              {t('home.allSolutions')}
            </Link>
          </div>

          <div className="home-solutions-grid">
            {featuredIndustries.map((industry) => (
              <Link key={industry.slug} href={withLocalePath(`/solutions/${industry.slug}`, locale)} className="home-solution-card">
                <span className="card-kicker">{t('home.industryKicker')}</span>
                <h3>{industry.title}</h3>
                <p className="section-description compact-copy">{industry.summary}</p>
                <span className="section-link">{t('home.exploreSolution')}</span>
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
              <h2 className="section-title">{t('home.featuredProducts')}</h2>
              <p className="section-description">{t('home.featuredDesc')}</p>
            </div>
            <Link href={withLocalePath('/products', locale)} className="section-link">
              {t('home.browseCatalogLink')}
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
              <h2 className="section-title">{t('home.whyTitle')}</h2>
              <p className="section-description">{t('home.whyDesc')}</p>
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
              <h2 className="section-title">{t('home.latestApplications')}</h2>
              <p className="section-description">{t('home.latestApplicationsDesc')}</p>
            </div>
            <Link href={withLocalePath('/applications', locale)} className="section-link">
              {t('home.allCaseStudies')}
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
                    {t('home.readMore')}
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
              <h2 className="section-title">{t('home.resourcesHubTitle')}</h2>
              <p className="section-description">{t('home.resourcesHubDesc')}</p>
            </div>
            <Link href={withLocalePath('/blog', locale)} className="section-link">
              {t('home.visitBlog')}
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
                <p className="product-meta">{article.publishedAt ? formatPublishedDate(article.publishedAt, dateFormatter, t('home.dateTbd')) : t('home.dateTbd')}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 11. Engineering Resources strip */}
      <section className="section">
        <div className="section-inner">
          <div className="home-eng-strip">
            <strong className="home-eng-strip-title">{t('home.engineeringResources')}</strong>
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
                {t('home.privacyAgree')}{' '}
                <Link href={withLocalePath('/legal/privacy', locale)} className="section-link">
                  {t('home.privacyPolicy')}
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
