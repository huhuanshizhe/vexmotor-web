import { setCartToken } from '@/lib/api-client';

export const CART_UPDATED_EVENT = 'vexmotor:cart-updated';

export type CartApiSnapshot = {
  cartToken?: string;
  itemCount?: number;
  items?: Array<{ id?: string; productId?: string }>;
};

export type CartUpdatedDetail = {
  /** Distinct line items in cart (header badge). */
  lineItemCount?: number;
  /** Sum of line quantities (cart page total). */
  itemCount?: number;
};

export function getCartLineItemCount(cart?: CartApiSnapshot | null) {
  return cart?.items?.length ?? 0;
}

export function persistCartSession(payload: CartApiSnapshot | null | undefined) {
  if (!payload || typeof window === 'undefined') {
    return;
  }

  if (payload.cartToken) {
    setCartToken(payload.cartToken);
  }
}

export function notifyCartUpdated(detail?: CartUpdatedDetail) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<CartUpdatedDetail>(CART_UPDATED_EVENT, { detail: detail ?? {} }));
}

export function notifyCartUpdatedFromResponse(cart?: CartApiSnapshot | null) {
  notifyCartUpdated({
    lineItemCount: getCartLineItemCount(cart),
    itemCount: cart?.itemCount,
  });
}
