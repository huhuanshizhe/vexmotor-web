import { type Locale } from '@/lib/i18n';

export type ProductTranslation = {
  productId: string;
  locale: Locale;
  name?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export async function getProductTranslation(
  _productId: string,
  _locale: Locale,
  _fallback = true,
): Promise<ProductTranslation | null> {
  return null;
}

export async function getProductTranslations(_productId: string): Promise<ProductTranslation[]> {
  return [];
}

export function applyProductTranslation<T extends { name: string; shortDescription?: string | null; description?: string | null }>(
  product: T,
  _translation: ProductTranslation | null,
): T {
  return product;
}
