import { catalogCategoryGroups } from '@/lib/site-shell';
import type { StorefrontCategory } from '@/lib/storefront-types';

export type ShellCatalogCategory = {
  slug: string;
  name: string;
};

function slugFromHref(href: string) {
  return href.replace(/^\/c\//, '');
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
      isFeatured: existing?.isFeatured,
      featuredOrder: existing?.featuredOrder,
    });
  }

  return Array.from(merged.values());
}
