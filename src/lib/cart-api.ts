import { apiFetch } from '@/lib/api-client';
import { notifyCartUpdatedFromResponse, type CartApiSnapshot } from '@/lib/cart-session';
import type { CartDetail } from '@/lib/storefront-types';

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  return apiFetch<CartDetail>(`/api/front/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeCartItem(itemId: string) {
  await apiFetch(`/api/front/cart/items/${itemId}`, { method: 'DELETE' });
  return apiFetch<CartDetail>('/api/front/cart');
}

export async function applyCartCoupon(couponCode: string | null) {
  return apiFetch<CartDetail>('/api/front/cart', {
    method: 'PATCH',
    body: JSON.stringify({ couponCode }),
  });
}

export function syncCartResponse(cart: CartDetail) {
  notifyCartUpdatedFromResponse(cart as CartApiSnapshot);
  return cart;
}
