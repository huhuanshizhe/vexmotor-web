import Link from 'next/link';
import type { ReactNode } from 'react';

export type CatalogFilterOption = {
  id: string;
  label: string;
  href: string;
  active?: boolean;
  count?: number;
};

export type CatalogFilterSection = {
  id: string;
  title: string;
  options: CatalogFilterOption[];
  defaultOpen?: boolean;
};

export type CatalogFilterShortcut = {
  id: string;
  label: string;
  href: string;
  count?: number;
  active?: boolean;
};

type CatalogFilterSidebarProps = {
  panelTitle: string;
  searchForm: ReactNode;
  sections: CatalogFilterSection[];
  shortcuts?: {
    title: string;
    items: CatalogFilterShortcut[];
    defaultOpen?: boolean;
  };
};

function FilterOptionRow({ option }: { option: CatalogFilterOption }) {
  return (
    <Link
      href={option.href}
      className={`catalog-filter-row${option.active ? ' is-active' : ''}`}
      aria-current={option.active ? 'true' : undefined}
    >
      <span className="catalog-filter-radio" aria-hidden="true" />
      <span className="catalog-filter-row-label">{option.label}</span>
      {typeof option.count === 'number' ? (
        <span className="catalog-filter-badge">{option.count}</span>
      ) : (
        <span className="catalog-filter-badge is-empty" aria-hidden="true" />
      )}
    </Link>
  );
}

export function CatalogFilterSidebar({
  panelTitle,
  searchForm,
  sections,
  shortcuts,
}: CatalogFilterSidebarProps) {
  return (
    <aside className="catalog-filter-sidebar" aria-label={panelTitle}>
      <div className="catalog-filter-panel catalog-filter-panel-search">
        <p className="catalog-filter-eyebrow">{panelTitle}</p>
        {searchForm}
      </div>

      {sections.map((section) => (
        <details key={section.id} className="catalog-filter-panel catalog-filter-panel-section" open={section.defaultOpen ?? true}>
          <summary className="catalog-filter-panel-head">
            <span className="catalog-filter-panel-title">{section.title}</span>
            <span className="catalog-filter-chevron" aria-hidden="true" />
          </summary>
          <div className="catalog-filter-panel-body">
            {section.options.map((option) => (
              <FilterOptionRow key={option.id} option={option} />
            ))}
          </div>
        </details>
      ))}

      {shortcuts?.items.length ? (
        <details className="catalog-filter-panel catalog-filter-panel-section" open={shortcuts.defaultOpen ?? false}>
          <summary className="catalog-filter-panel-head">
            <span className="catalog-filter-panel-title">{shortcuts.title}</span>
            <span className="catalog-filter-chevron" aria-hidden="true" />
          </summary>
          <div className="catalog-filter-panel-body catalog-filter-shortcut-list">
            {shortcuts.items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`catalog-filter-shortcut${item.active ? ' is-active' : ''}`}
                aria-current={item.active ? 'page' : undefined}
              >
                <span className="catalog-filter-shortcut-label">{item.label}</span>
                {typeof item.count === 'number' ? (
                  <span className="catalog-filter-shortcut-count">{item.count}</span>
                ) : null}
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </aside>
  );
}

export function buildCategorySection(input: {
  id?: string;
  title: string;
  allLabel: string;
  facets: Array<{ key: string; options: Array<{ label: string; value: string; count: number }> }>;
  shellCategories: Array<{ slug: string; name: string }>;
  selectedCategorySlug?: string;
  buildHref: (categorySlug: string | null) => string;
  defaultOpen?: boolean;
}): CatalogFilterSection {
  const countBySlug = new Map(
    input.facets.find((facet) => facet.key === 'category')?.options.map((option) => [option.value, option.count]) ?? [],
  );
  const totalCount = [...countBySlug.values()].reduce((sum, count) => sum + count, 0);

  return {
    id: input.id ?? 'category',
    title: input.title,
    defaultOpen: input.defaultOpen ?? true,
    options: [
      {
        id: 'category-all',
        label: input.allLabel,
        href: input.buildHref(null),
        active: !input.selectedCategorySlug,
        count: totalCount,
      },
      ...input.shellCategories.map((category) => ({
        id: `category-${category.slug}`,
        label: category.name,
        href: input.buildHref(input.selectedCategorySlug === category.slug ? null : category.slug),
        active: input.selectedCategorySlug === category.slug,
        count: countBySlug.get(category.slug) ?? 0,
      })),
    ],
  };
}

export function buildPurchaseModeSection(input: {
  id?: string;
  title: string;
  allLabel: string;
  facets: Array<{ key: string; label: string; options: Array<{ label: string; value: string; count: number }> }>;
  selectedMode?: 'buy' | 'inquiry';
  buildHref: (mode: 'buy' | 'inquiry' | null) => string;
  defaultOpen?: boolean;
}): CatalogFilterSection | null {
  const purchaseFacet = input.facets.find((facet) => facet.key === 'purchaseMode');
  if (!purchaseFacet?.options.length) {
    return null;
  }

  return {
    id: input.id ?? 'purchase-mode',
    title: input.title,
    defaultOpen: input.defaultOpen ?? true,
    options: [
      {
        id: 'purchase-mode-all',
        label: input.allLabel,
        href: input.buildHref(null),
        active: !input.selectedMode,
        count: purchaseFacet.options.reduce((sum, option) => sum + option.count, 0),
      },
      ...purchaseFacet.options.map((option) => ({
        id: `purchase-mode-${option.value}`,
        label: option.label,
        href: input.buildHref(input.selectedMode === option.value ? null : (option.value as 'buy' | 'inquiry')),
        active: input.selectedMode === option.value,
        count: option.count,
      })),
    ],
  };
}
