import Image from 'next/image';
import Link from 'next/link';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { JsonLdScript } from '@/components/seo/json-ld';
import { withLocalePath } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { buildBreadcrumbJsonLd, buildMetadata } from '@/lib/seo';
import { catalogCategoryGroups } from '@/lib/site-shell';
import { getCategories } from '@/lib/storefront-api';

export const revalidate = 120;

function slugFromHref(href: string) {
  return href.replace(/^\/c\//, '');
}

function CategoryTile({
  slug,
  name,
  productCount,
  locale,
}: {
  slug: string;
  name: string;
  productCount?: number;
  locale: Locale;
}) {
  return (
    <li>
      <Link href={withLocalePath(`/c/${slug}`, locale)} className="home-category-card">
        <div className="home-category-image">
          <Image
            src={`/categories/${slug}.png`}
            alt={name}
            width={200}
            height={200}
            sizes="(max-width: 768px) 150px, 200px"
            unoptimized
          />
        </div>
        <span className="home-category-name">{name}</span>
        {typeof productCount === 'number' && productCount > 0 ? (
          <span className="home-category-count">{productCount} products</span>
        ) : null}
      </Link>
    </li>
  );
}

export async function generateMetadata() {
  const { locale } = await getServerSitePreferences();
  return buildMetadata({
    title: 'All Categories — STEPMOTECH',
    description: 'Browse stepper motors, drivers, power supplies, and matched motion components by product family.',
    path: '/categories',
    locale,
  });
}

export default async function CategoriesPage() {
  const { locale } = await getServerSitePreferences();
  const apiCategories = await getCategories().catch(() => []);
  const countBySlug = new Map(apiCategories.map((category) => [category.slug, category.productCount ?? 0]));

  const groupedFamilies = catalogCategoryGroups.filter((group) => group.children?.length);
  const topLevelFamilies = catalogCategoryGroups.filter((group) => !group.children?.length);
  const totalFamilies = catalogCategoryGroups.length;
  const totalSkus = apiCategories.reduce((sum, category) => sum + (category.productCount ?? 0), 0);

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { name: 'Home', path: '/' },
      { name: 'Categories', path: '/categories' },
    ],
    locale,
  );

  return (
    <StorefrontFrame
      eyebrow="Categories"
      title="All product categories"
      description={`Browse ${totalFamilies} motion product families and ${totalSkus > 0 ? `${totalSkus}+ catalog SKUs` : 'engineering-grade SKUs'} across stepper motors, drivers, power, and integrated kits.`}
      actions={
        <Link href={withLocalePath('/products', locale)} className="button-secondary">
          Open full catalog
        </Link>
      }
    >
      <JsonLdScript id="categories-breadcrumb-jsonld" data={breadcrumbJsonLd} />

      <section className="section">
        <div className="section-inner categories-page-stack">
          {groupedFamilies.map((group) => (
              <article key={group.label} className="categories-page-group">
                <div className="section-header categories-page-group-header">
                  <div>
                    <h2 className="section-title">{group.label}</h2>
                    <p className="section-description">Frame-size and torque families within the {group.label.toLowerCase()} line.</p>
                  </div>
                  <Link href={withLocalePath(group.href, locale)} className="section-link">
                    View all {group.label}
                  </Link>
                </div>
                <ul className="home-category-grid-18">
                  {group.children?.map((child) => {
                    const slug = slugFromHref(child.href);
                    return (
                      <CategoryTile
                        key={slug}
                        slug={slug}
                        name={child.label}
                        productCount={countBySlug.get(slug)}
                        locale={locale}
                      />
                    );
                  })}
                </ul>
              </article>
          ))}

          <article className="categories-page-group">
            <div className="section-header categories-page-group-header">
              <div>
                <h2 className="section-title">Drivers, power & integrated motion</h2>
                <p className="section-description">Matched drivers, supplies, and motor kits for complete motion stacks.</p>
              </div>
            </div>
            <ul className="home-category-grid-18">
              {topLevelFamilies.map((group) => {
                const slug = slugFromHref(group.href);
                return (
                  <CategoryTile
                    key={slug}
                    slug={slug}
                    name={group.label}
                    productCount={countBySlug.get(slug)}
                    locale={locale}
                  />
                );
              })}
            </ul>
          </article>
        </div>
      </section>
    </StorefrontFrame>
  );
}
