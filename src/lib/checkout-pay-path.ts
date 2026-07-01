export function buildCheckoutPayPath(orderNumber: string, guestToken?: string) {
  const base = `/checkout/pay/${encodeURIComponent(orderNumber)}`;
  if (!guestToken) {
    return base;
  }
  return `${base}?guestToken=${encodeURIComponent(guestToken)}`;
}

export function orderNeedsCardPayment(order: { paymentStatus: string; paymentMethod: string }) {
  return order.paymentStatus !== 'paid' && order.paymentMethod === 'Credit Card';
}
