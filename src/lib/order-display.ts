export const orderStatusLabels: Record<string, string> = {
  unpaid: 'Unpaid',
  pending_processing: 'Processing',
  partially_shipped: 'Partially shipped',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  terminated: 'Terminated',
};

export const paymentStatusLabels: Record<string, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
};

export const shippingStatusLabels: Record<string, string> = {
  unshipped: 'Unshipped',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

export const refundStatusLabels: Record<string, string> = {
  none: 'None',
  pending: 'Pending review',
  refunded: 'Refunded',
  partially_refunded: 'Partially refunded',
  refund_rejected: 'Refund rejected',
};

export const refundTypeLabels: Record<string, string> = {
  full_refund: 'Full refund',
  partial_refund: 'Partial refund',
  no_refund: 'No refund',
};

export const returnTypeLabels: Record<string, string> = {
  return_goods: 'Return goods',
  no_return: 'No return',
};

export function orderStatusPillClass(status: string) {
  return `account-order-status-pill account-order-status-pill--order-${status}`;
}

export function paymentStatusPillClass(status: string) {
  return `account-order-status-pill account-order-status-pill--payment-${status}`;
}

export function shippingStatusPillClass(status: string) {
  return `account-order-status-pill account-order-status-pill--shipping-${status}`;
}

export function refundStatusPillClass(status: string) {
  return `account-order-status-pill account-order-status-pill--refund-${status}`;
}

export function formatOrderMoney(amount: string | number, currency = 'USD', locale = 'en') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number(amount));
}

export function formatOrderDate(value: string | null | undefined, locale = 'en') {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString(locale);
}
