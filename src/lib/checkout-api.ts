import { apiFetch } from '@/lib/api-client';
import type { CartDetail } from '@/lib/storefront-types';

export type BuyNowPayload = {
  productId: string;
  quantity: number;
  featureValueIds?: string[];
};

export async function fetchBuyNowPreview(payload: BuyNowPayload) {
  return apiFetch<CartDetail>('/api/front/checkout/buy-now-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchQuoteCheckoutPreview(quoteNumber: string) {
  return apiFetch<CartDetail & { quoteNumber?: string; readOnlyQuantities?: boolean }>(
    `/api/front/checkout/quote-preview?quoteNumber=${encodeURIComponent(quoteNumber)}`,
  );
}
