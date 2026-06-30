export function resolveProductSku(product: { sku?: string | null; spu?: string | null }) {
  return product.sku?.trim() || product.spu?.trim() || '';
}

export function productSkuBadge(product: { sku?: string | null; spu?: string | null }) {
  const code = resolveProductSku(product);
  return code.slice(0, 3).toUpperCase() || '—';
}

export function productSpuBadge(product: { spu?: string | null; sku?: string | null }) {
  const code = product.spu?.trim() || product.sku?.trim() || '';
  return code.slice(0, 3).toUpperCase() || '—';
}
