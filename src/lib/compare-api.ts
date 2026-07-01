import { apiFetch } from '@/lib/api-client';

export type CompareProductSummary = {
  id: string;
  name: string;
  slug: string;
  spu: string;
  brand: string | null;
  category: string | null;
  price: {
    currency: string;
    amount: number;
    formatted: string;
  };
  stockQuantity: number;
  inStock: boolean;
  purchaseMode: string;
};

export type CompareMatrixRow = {
  key: string;
  label: string;
  group: string;
  values: string[];
  isDifferent: boolean;
};

export type CompareResult = {
  locale: string;
  products: CompareProductSummary[];
  groups: Array<{ name: string; rows: string[] }>;
  matrix: CompareMatrixRow[];
  summary: {
    sharedFeatureKeys: string[];
    uniqueByProduct: Array<{ productId: string; keys: string[] }>;
  };
};

export type CompareServerItem = {
  id: string;
  productId: string;
  sortOrder: number;
  createdAt: string;
  product: CompareProductSummary;
};

export type CompareItemsResponse = {
  locale: string;
  items: CompareServerItem[];
};

export async function fetchProductCompare(productIds: string[]) {
  return apiFetch<CompareResult>('/api/front/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productIds }),
  });
}

export async function fetchCompareItems() {
  return apiFetch<CompareItemsResponse>('/api/front/compare/items');
}

export async function addCompareItemRemote(productId: string) {
  return apiFetch<CompareItemsResponse>('/api/front/compare/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });
}

export async function removeCompareItemRemote(productId: string) {
  return apiFetch<void>(`/api/front/compare/items/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}

export async function clearCompareItemsRemote(productIds: string[]) {
  await Promise.all(productIds.map((productId) => removeCompareItemRemote(productId).catch(() => undefined)));
}
