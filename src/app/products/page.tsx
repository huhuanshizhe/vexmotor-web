import Link from 'next/link';
import { redirect } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { getCategories } from '@/lib/storefront-api';

// ISR: revalidate product list every 2 minutes
export const revalidate = 120;

const industryDefinitions = [
  { id: 'automation', label: 'Factory Automation', categories: ['nema-17-stepper-motor', 'stepper-drivers', 'power-supplies'] },
  { id: 'cnc', label: 'CNC & Tooling', categories: ['nema-23-stepper-motor', 'gearboxes', 'linear-motion'] },
  { id: 'robotics', label: 'Robotics', categories: ['nema-17-stepper-motor', 'nema-23-stepper-motor', 'gearboxes'] },
  { id: 'medical', label: 'Medical Devices', categories: ['nema-17-stepper-motor', 'linear-motion'] },
  { id: 'packaging', label: 'Packaging', categories: ['stepper-drivers', 'power-supplies', 'linear-motion'] },
  { id: 'laboratory', label: 'Lab Automation', categories: ['nema-17-stepper-motor', 'power-supplies', 'linear-motion'] },
] as const;

const quickLinks = [
  {
    label: 'CAD Library',
    href: '/resources/cad',
    description: 'Jump into products and files commonly requested for 3D integration workflows.',
  },
  {
    label: 'Datasheet Library',
    href: '/resources/datasheet',
    description: 'Find downloadable technical sheets across motion categories and matched kits.',
  },
  {
    label: 'Selector Tool',
    href: '/selector',
    description: 'Step through application, mechanics, electrical fit, and feedback needs before jumping into SKU matches.',
  },
  {
    label: 'Volume Pricing',
    href: '/volume-pricing',
    description: 'Review published tiers, estimate annual savings, and request contract pricing for repeat demand.',
  },
] as const;

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
  title: 'Product Catalog — STEPMOTECH',
  description: 'Browse engineering-grade motion categories, application shortcuts, CAD, datasheets, and direct category entry points.',
  path: '/products',
    locale,
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; sort?: string; industry?: string; category?: string }>;
}) {
  const [{ locale }, categories, params] = await Promise.all([getServerSitePreferences(), getCategories(), searchParams]);
  const legacyCategoryAliases: Record<string, string> = {
    'power-supplies': 'power-supply',
    'stepper-drivers': 'stepper-motor-driver',
  };
  const keywordCategoryAliases: Record<string, string> = {
    'nema 8 stepper motor': 'nema-8-stepper-motor',
    'nema 11 stepper motor': 'nema-11-stepper-motor',
    'nema 14 stepper motor': 'nema-14-stepper-motor',
    'nema 16 stepper motor': 'nema-16-stepper-motor',
    'nema 17 stepper motor': 'nema-17-stepper-motor',
    'nema 23 stepper motor': 'nema-23-stepper-motor',
    'nema 24 stepper motor': 'nema-24-stepper-motor',
    'nema 34 stepper motor': 'nema-34-stepper-motor',
    'power supply': 'power-supply',
    'stepper motor driver': 'stepper-motor-driver',
    'closed loop stepper motor': 'closed-loop-stepper-motor',
    'brushless spindle motor': 'brushless-spindle-motor',
    'brushless dc motor': 'brushless-dc-motor',
    'integrated stepper motor': 'integrated-stepper-motor',
  };
  const redirectedCategorySlug = params.category
    ? legacyCategoryAliases[params.category] ?? params.category
    : params.keyword
      ? keywordCategoryAliases[params.keyword.trim().toLowerCase()] ?? null
      : null;

  if (redirectedCategorySlug && categories.some((category) => category.slug === redirectedCategorySlug)) {
    redirect(withLocalePath(`/c/${redirectedCategorySlug}`, locale));
  }

  const activeIndustries = new Set((params.industry ?? '').split(',').map((value) => value.trim()).filter(Boolean));
  const sort = params.sort === 'name-asc' ? 'name-asc' : 'popular';
  const keyword = params.keyword?.trim().toLowerCase() ?? '';

  function buildCatalogHref(overrides: { keyword?: string | null; sort?: string | null; industries?: string[] }) {
    const search = new URLSearchParams();
    const nextKeyword = overrides.keyword !== undefined ? overrides.keyword : params.keyword;
    const nextSort = overrides.sort !== undefined ? overrides.sort : sort;
    const nextIndustries = overrides.industries ?? Array.from(activeIndustries);

    if (nextKeyword) {
      search.set('keyword', nextKeyword);
    }

    if (nextSort && nextSort !== 'popular') {
      search.set('sort', nextSort);
    }

    if (nextIndustries.length) {
      search.set('industry', nextIndustries.join(','));
    }

    const query = search.toString();
    return query ? `${withLocalePath('/products', locale)}?${query}` : withLocalePath('/products', locale);
  }

  const filteredCategories = categories
    .filter((category) => {
      const matchesKeyword = !keyword || `${category.name} ${category.description ?? ''}`.toLowerCase().includes(keyword);
      const matchesIndustry = !activeIndustries.size || industryDefinitions.some((industry) => activeIndustries.has(industry.id) && industry.categories.some((slug) => slug === category.slug));
      return matchesKeyword && matchesIndustry;
    })
    .sort((left, right) => {
      if (sort === 'name-asc') {
        return left.name.localeCompare(right.name);
      }

      return (right.productCount ?? 0) - (left.productCount ?? 0);
    });

  const totalSkuCount = categories.reduce((sum, category) => sum + (category.productCount ?? 0), 0);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Products', path: '/products' },
    ],
    locale,
  );
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Product Catalog',
    description: 'Engineering-grade motion product catalog with category entry points, application shortcuts, and quick links.',
  };

  return (
    <StorefrontFrame
      eyebrow="Catalog"
      title="Product Catalog"
      description={`${totalSkuCount} engineering-grade SKUs across ${categories.length} motion categories and matched support components.`}
      actions={
        <form action={withLocalePath('/products', locale)} className="search-inline-form">
          <input name="keyword" defaultValue={params.keyword ?? ''} className="newsletter-input" placeholder="Search category names or engineering use cases" />
          <button type="submit" className="button-primary">
            Search Catalog
          </button>
        </form>
      }
    >
      <JsonLdScript id="catalog-breadcrumb-jsonld" data={breadcrumbJsonLd} />
      <JsonLdScript id="catalog-page-jsonld" data={collectionJsonLd} />

      <section className="section catalog-landing-section">
        <div className="section-inner catalog-stack">
          <div className="catalog-landing-toolbar info-card">
            <div>
              <strong className="catalog-toolbar-heading">Catalog tools</strong>
              <p className="section-description compact-copy">Sort category blocks and narrow them by application context before entering the PLP.</p>
            </div>

            <div className="catalog-toolbar-actions">
              <div className="filter-chip-list">
                <Link href={buildCatalogHref({ sort: 'popular' })} className={`filter-chip filter-chip-link${sort === 'popular' ? ' is-active' : ''}`}>
                  Most Popular
                </Link>
                <Link href={buildCatalogHref({ sort: 'name-asc' })} className={`filter-chip filter-chip-link${sort === 'name-asc' ? ' is-active' : ''}`}>
                  A-Z
                </Link>
              </div>
            </div>
          </div>

          <div className="catalog-industry-strip info-card">
            <div>
              <strong className="catalog-toolbar-heading">By industry shortcuts</strong>
              <p className="section-description compact-copy">Apply one or more application shortcuts to highlight the most relevant category entry points.</p>
            </div>
            <div className="filter-chip-list">
              {industryDefinitions.map((industry) => {
                const nextIndustries = activeIndustries.has(industry.id)
                  ? Array.from(activeIndustries).filter((item) => item !== industry.id)
                  : [...Array.from(activeIndustries), industry.id];

                return (
                  <Link key={industry.id} href={buildCatalogHref({ industries: nextIndustries })} className={`filter-chip filter-chip-link${activeIndustries.has(industry.id) ? ' is-active' : ''}`}>
                    {industry.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="catalog-landing-grid">
            {filteredCategories.map((category) => {
              const highlightedIndustries = industryDefinitions.filter((industry) => industry.categories.some((slug) => slug === category.slug)).slice(0, 3);
              const relatedCategories = categories.filter((item) => item.slug !== category.slug).slice(0, 3);
              const isHighlighted = !activeIndustries.size || highlightedIndustries.some((industry) => activeIndustries.has(industry.id));

              return (
                <section key={category.id} className={`info-card category-block-card${isHighlighted ? ' is-highlighted' : ''}`} aria-labelledby={`category-block-${category.slug}`}>
                  <div className="category-block-header">
                    <div>
                      <div className="card-kicker">Category</div>
                      <h2 id={`category-block-${category.slug}`} className="section-title category-block-title">
                        {category.name}
                      </h2>
                    </div>
                    <span className="product-badge">{category.productCount ?? 0} SKUs</span>
                  </div>

                  <p className="section-description">{category.description ?? 'Engineering-grade motion components with direct-buy and RFQ coverage.'}</p>

                  <div className="filter-chip-list">
                    {highlightedIndustries.map((industry) => (
                      <span key={industry.id} className="filter-chip">
                        {industry.label}
                      </span>
                    ))}
                  </div>

                  <div className="category-block-footer">
                    <div className="category-block-links">
                      {relatedCategories.map((item) => (
                        <Link key={`${category.slug}-${item.slug}`} href={withLocalePath(`/c/${item.slug}`, locale)} className="section-link">
                          {item.name}
                        </Link>
                      ))}
                    </div>

                    <Link href={withLocalePath(`/c/${category.slug}`, locale)} className="ui-button is-brand is-sm">
                      Explore
                    </Link>
                  </div>
                </section>
              );
            })}
          </div>

          <div className="catalog-quick-links info-card">
            <div>
              <strong className="catalog-toolbar-heading">Quick links</strong>
              <p className="section-description compact-copy">Fast paths into files, selector workflows, and pricing-related discovery.</p>
            </div>

            <div className="catalog-quick-links-grid">
              {quickLinks.map((link) => (
                <Link key={link.label} href={withLocalePath(link.href, locale)} className="category-card catalog-quick-link-card">
                  <span className="card-kicker">Tools</span>
                  <strong>{link.label}</strong>
                  <span className="section-description compact-copy">{link.description}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}
