import { apiFetch } from '@/lib/api-client';
import type { Locale } from '@/lib/i18n';
import { notifyCartUpdatedFromResponse, type CartApiSnapshot } from '@/lib/cart-session';
import type { CartDetail } from '@/lib/storefront-types';

export async function updateCartItemQuantity(itemId: string, quantity: number, locale?: Locale) {
  return apiFetch<CartDetail>(`/api/front/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
    locale,
  });
}

export async function removeCartItem(itemId: string, locale?: Locale) {
  await apiFetch(`/api/front/cart/items/${itemId}`, { method: 'DELETE', locale });
  return apiFetch<CartDetail>('/api/front/cart', { locale });
}

export async function applyCartCoupon(couponCode: string | null, locale?: Locale) {
  return apiFetch<CartDetail>('/api/front/cart', {
    method: 'PATCH',
    body: JSON.stringify({ couponCode }),
    locale,
  });
}

export function syncCartResponse(cart: CartDetail) {
  notifyCartUpdatedFromResponse(cart as CartApiSnapshot);
  return cart;
}
