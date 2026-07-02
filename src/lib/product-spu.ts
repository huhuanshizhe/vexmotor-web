export function resolveProductSpu(product: { spu?: string | null }) {
  return product.spu?.trim() || '';
}

export function productSpuBadge(product: { spu?: string | null }) {
  const code = resolveProductSpu(product);
  return code.slice(0, 3).toUpperCase() || '—';
}
