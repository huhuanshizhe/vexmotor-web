import { catalogCategoryGroups } from '@/lib/site-shell';
import type { NavigationData, StorefrontCategory, StorefrontLink } from '@/lib/storefront-types';

export type ShellCatalogCategory = {
  slug: string;
  name: string;
};

export type LocalizedCategoryNavEntry = {
  name: string;
  slug: string;
};

function slugFromHref(href: string) {
  return href.replace(/^\/c\//, '');
}

function shellSlugFromHref(href: string) {
  const match = href.match(/^\/c\/([^/?#]+)/);
  return match?.[1] ?? null;
}

/** Map shell /c/{en-slug} hrefs to locale-specific category labels and slugs. */
export function buildCategoryLookupByShellSlug(
  localizedCategories: StorefrontCategory[],
  canonicalCategories: StorefrontCategory[],
): Map<string, LocalizedCategoryNavEntry> {
  const localizedById = new Map(localizedCategories.map((category) => [category.id, category]));
  const lookup = new Map<string, LocalizedCategoryNavEntry>();

  for (const category of canonicalCategories) {
    if (!category.slug) continue;
    const localized = localizedById.get(category.id) ?? category;
    lookup.set(category.slug, {
      name: localized.name || category.name,
      slug: localized.slug || category.slug,
    });
  }

  return lookup;
}

function localizeStorefrontNavLink(
  link: StorefrontLink,
  categoryLookup: Map<string, LocalizedCategoryNavEntry>,
): StorefrontLink {
  const shellSlug = shellSlugFromHref(link.href);
  const match = shellSlug ? categoryLookup.get(shellSlug) : undefined;

  return {
    ...link,
    href: match ? `/c/${match.slug}` : link.href,
    label: match?.name ?? link.label,
    children: link.children?.map((child) => localizeStorefrontNavLink(child, categoryLookup)),
  };
}

export function localizeStorefrontNavigation(
  navigation: NavigationData,
  categoryLookup: Map<string, LocalizedCategoryNavEntry>,
): NavigationData {
  if (!categoryLookup.size) {
    return navigation;
  }

  return {
    ...navigation,
    mainLinks: navigation.mainLinks.map((link) => localizeStorefrontNavLink(link, categoryLookup)),
  };
}

/** All category slugs linked from navigation — web-owned catalog structure. */
export function listShellCatalogCategories(): ShellCatalogCategory[] {
  const seen = new Set<string>();
  const items: ShellCatalogCategory[] = [];

  for (const group of catalogCategoryGroups) {
    const parentSlug = slugFromHref(group.href);
    if (!seen.has(parentSlug)) {
      seen.add(parentSlug);
      items.push({ slug: parentSlug, name: group.label });
    }

    for (const child of group.children ?? []) {
      const slug = slugFromHref(child.href);
      if (!seen.has(slug)) {
        seen.add(slug);
        items.push({ slug, name: child.label });
      }
    }
  }

  return items;
}

export function getShellCategoryBySlug(slug: string): ShellCatalogCategory | undefined {
  return listShellCatalogCategories().find((category) => category.slug === slug);
}

export function resolveStorefrontCategory(
  slug: string,
  apiCategories: StorefrontCategory[],
): StorefrontCategory | null {
  const fromApi = apiCategories.find((category) => category.slug === slug);
  const fromShell = getShellCategoryBySlug(slug);

  if (!fromApi && !fromShell) {
    return null;
  }

  return {
    id: fromApi?.id ?? fromShell!.slug,
    name: fromApi?.name || fromShell!.name,
    slug: fromApi?.slug || fromShell!.slug,
    description: fromApi?.description,
    image: fromApi?.image,
    parentId: fromApi?.parentId,
    productCount: fromApi?.productCount,
    rollupProductCount: fromApi?.rollupProductCount,
    isFeatured: fromApi?.isFeatured,
    featuredOrder: fromApi?.featuredOrder,
  };
}

/** Prefer API fields when present; ensure shell-linked categories always resolve. */
export function mergeCategoriesWithShell(apiCategories: StorefrontCategory[]): StorefrontCategory[] {
  const merged = new Map<string, StorefrontCategory>();

  for (const category of apiCategories) {
    if (category.slug) {
      merged.set(category.slug, category);
    }
  }

  for (const shell of listShellCatalogCategories()) {
    const existing = merged.get(shell.slug);
    merged.set(shell.slug, {
      id: existing?.id ?? shell.slug,
      name: existing?.name || shell.name,
      slug: shell.slug,
      description: existing?.description,
      image: existing?.image,
      parentId: existing?.parentId,
      productCount: existing?.productCount,
      rollupProductCount: existing?.rollupProductCount,
      isFeatured: existing?.isFeatured,
      featuredOrder: existing?.featuredOrder,
    });
  }

  return Array.from(merged.values());
}

function topLevelRollupCount(entry: StorefrontCategory | undefined, rollupBySlug: Map<string, number>, slug: string) {
  return rollupBySlug.get(slug) ?? entry?.rollupProductCount ?? entry?.productCount ?? 0;
}

export function buildTopLevelRollupBySlug(apiCategories: StorefrontCategory[]): Map<string, number> {
  const rollupBySlug = new Map<string, number>();

  for (const category of apiCategories) {
    if (!category.slug || category.parentId) {
      continue;
    }
    rollupBySlug.set(category.slug, category.rollupProductCount ?? category.productCount ?? 0);
  }

  return rollupBySlug;
}

/** Top-level sidebar categories in navigation order, with rollup product counts. */
export function listCatalogSidebarCategories(
  apiCategories: StorefrontCategory[],
  options?: { excludeSlug?: string },
): StorefrontCategory[] {
  const merged = new Map(
    mergeCategoriesWithShell(apiCategories)
      .filter((item) => item.slug)
      .map((item) => [item.slug, item]),
  );
  const rollupBySlug = buildTopLevelRollupBySlug(apiCategories);

  return catalogCategoryGroups.flatMap((group) => {
    const slug = slugFromHref(group.href);
    if (slug === options?.excludeSlug) {
      return [];
    }

    const entry = merged.get(slug);
    return [
      {
        id: entry?.id ?? slug,
        name: entry?.name || group.label,
        slug,
        productCount: topLevelRollupCount(entry, rollupBySlug, slug),
      },
    ];
  });
}
