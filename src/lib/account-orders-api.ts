import { apiFetch } from '@/lib/api-client';

export type AccountOrderListItem = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  refundStatus: string;
  totalAmount: string;
  currencyCode: string;
  paymentMethod: string | null;
  placedAt: string | null;
  itemCount: number;
};

export type AccountOrdersListResult = {
  items: AccountOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AccountOrdersQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  paymentStatus?: string;
  orderStatus?: string;
};

export type AccountOrderCoverImage = {
  url: string;
  alt: string;
  width?: number | null;
  height?: number | null;
};

export type AccountOrderLineItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  coverImage?: AccountOrderCoverImage | null;
  featureSelections?: Array<{
    definitionName: string;
    display: string;
    unit?: string | null;
  }>;
};

export type AccountOrderShipment = {
  id: string;
  trackingNumber: string;
  shippedAt: string;
  note: string | null;
  createdAt: string;
  items: Array<{
    orderItemId: string;
    productName: string;
    sku: string;
    quantity: number | null;
  }>;
};

export type AccountOrderCoupon = {
  id: string;
  couponCode: string;
  couponName: string | null;
  discountAmount: string;
  discountType: string;
  discountValue: string;
  scopeSummary: string | null;
};

export type AccountOrderRefundRequest = {
  id: string;
  refundType: string;
  returnType: string;
  reason: string | null;
  requestedAmount: string | null;
  processedAmount: string | null;
  processedAt: string | null;
  createdAt: string;
};

export type AccountOrderBuyerReferences = {
  poNumber: string | null;
  taxId: string | null;
  contactEmail: string | null;
  narrative: string | null;
};

export type AccountOrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  refundStatus: string;
  locale: string;
  currencyCode: string;
  subtotal: string;
  shippingAmount: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  shippingMethod: string | null;
  paymentMethod: string | null;
  placedAt: string | null;
  createdAt: string;
  customerNote: string | null;
  shippingAddressSnapshot: Record<string, string | null>;
  billingAddressSnapshot: Record<string, string | null>;
  items: AccountOrderLineItem[];
  shipments: AccountOrderShipment[];
  coupon: AccountOrderCoupon | null;
  refundRequest: AccountOrderRefundRequest | null;
  buyerReferences: AccountOrderBuyerReferences;
  canPay: boolean;
  canCancel: boolean;
  canRequestRefund: boolean;
};

export type AccountOrderRefundInput = {
  refundType: 'full_refund' | 'partial_refund';
  returnType: 'return_goods' | 'no_return';
  reason: string;
  requestedAmount?: string;
};

function buildOrdersQuery(query: AccountOrdersQuery = {}) {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.pageSize) params.set('pageSize', String(query.pageSize));
  if (query.q?.trim()) params.set('q', query.q.trim());
  if (query.paymentStatus && query.paymentStatus !== 'all') params.set('paymentStatus', query.paymentStatus);
  if (query.orderStatus && query.orderStatus !== 'all') params.set('orderStatus', query.orderStatus);
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
}

export async function fetchAccountOrders(query: AccountOrdersQuery = {}) {
  return apiFetch<AccountOrdersListResult>(`/api/front/orders${buildOrdersQuery(query)}`);
}

export async function fetchAccountOrderDetail(orderNumber: string) {
  return apiFetch<AccountOrderDetail>(`/api/front/orders/${encodeURIComponent(orderNumber)}`);
}

export async function cancelAccountOrder(orderNumber: string) {
  return apiFetch<{ orderNumber: string; status: string; paymentStatus: string }>(
    `/api/front/orders/${encodeURIComponent(orderNumber)}/cancel`,
    { method: 'POST' },
  );
}

export async function requestAccountOrderRefund(orderNumber: string, payload: AccountOrderRefundInput) {
  return apiFetch<{ refundStatus: string; refundRequest: AccountOrderRefundRequest }>(
    `/api/front/orders/${encodeURIComponent(orderNumber)}/refund-requests`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
