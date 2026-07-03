import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import type { CartDetail } from '@/lib/storefront-types';

export type BuyNowPayload = {
  productId: string;
  quantity: number;
  featureValueIds?: string[];
};

export async function fetchBuyNowPreview(payload: BuyNowPayload, locale?: Locale) {
  return apiFetch<CartDetail>('/api/front/checkout/buy-now-preview', {
    method: 'POST',
    body: JSON.stringify(payload),
    locale,
  });
}

export async function fetchQuoteCheckoutPreview(quoteNumber: string, locale?: Locale) {
  return apiFetch<CartDetail & { quoteNumber?: string; readOnlyQuantities?: boolean }>(
    `/api/front/checkout/quote-preview?quoteNumber=${encodeURIComponent(quoteNumber)}`,
    { locale },
  );
}
