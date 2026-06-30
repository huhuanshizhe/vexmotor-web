import { apiFetch } from '@/lib/api-client';

export type AccountAddress = {
  id: string;
  firstName: string;
  lastName: string;
  company?: string | null;
  phone?: string | null;
  countryCode: string;
  state?: string | null;
  city: string;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode: string;
  isDefault: boolean;
};

export type AccountOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: unknown;
  paymentMethod?: string | null;
  placedAt: string | null;
};

export async function fetchAccountSummary() {
  return apiFetch<{ orders: number; addresses: number; inquiries: number; wishlist: number }>('/api/front/account/summary');
}

export async function fetchOrders() {
  return apiFetch<AccountOrder[]>('/api/front/orders');
}

export async function fetchOrderByNumber(orderNumber: string) {
  return apiFetch(`/api/front/orders/${encodeURIComponent(orderNumber)}`);
}

export async function fetchAddresses() {
  return apiFetch<AccountAddress[]>('/api/front/addresses');
}

export async function fetchWishlist() {
  return apiFetch<{ items: WishlistItem[] }>('/api/front/wishlist');
}

export type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  spu: string;
  shortDescription?: string | null;
  purchaseMode: 'buy' | 'inquiry';
  price: {
    currency: string;
    amount: number;
    formatted: string;
  };
  inStock: boolean;
  coverImage?: {
    id: string;
    url: string;
    alt: string;
    width?: number | null;
    height?: number | null;
  } | null;
};

export async function removeWishlistItem(productId: string) {
  return apiFetch<void>(`/api/front/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}

export async function fetchInquiries() {
  return apiFetch('/api/front/inquiries');
}

export async function fetchCart<T = unknown>() {
  return apiFetch<T>('/api/front/cart');
}

export async function fetchGuestOrder(orderNumber: string) {
  return apiFetch(`/api/front/orders/${encodeURIComponent(orderNumber)}`);
}

export async function fetchInquiryDetail(inquiryId: string) {
  return apiFetch(`/api/front/inquiries/${encodeURIComponent(inquiryId)}`);
}
