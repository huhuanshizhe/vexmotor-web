import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StorefrontFrame } from '@/components/layout/storefront-frame';
import { serverFetch } from '@/lib/api-client';
import { parseOrderNote } from '@/lib/order-note';
import { getProductList } from '@/lib/storefront-api';

import { ConfirmationActions } from './confirmation-actions';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function getShippingTiming(shippingMethod: string) {
  if (shippingMethod === 'Sea-LCL') {
    return {
      estimatedShip: '3-5 business days',
      estimatedDelivery: '18-28 days after dispatch',
    };
  }

  if (shippingMethod === 'Warehouse pickup') {
    return {
      estimatedShip: 'Pickup readiness in 1 business day',
      estimatedDelivery: 'Collection scheduled by your forwarder',
    };
  }

  return {
    estimatedShip: '1-2 business days',
    estimatedDelivery: '3-6 business days after dispatch',
  };
}

function getPaymentStatus(paymentMethod: string) {
  if (paymentMethod === 'Wire transfer') {
    return 'Awaiting remittance';
  }

  if (paymentMethod === 'PayPal') {
    return 'Payment authorization received';
  }

  return 'Authorization pending capture';
}

function formatAmount(amount: string) {
  return `$${Number(amount).toFixed(2)}`;
}

export default async function CheckoutConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ guestToken?: string }>;
}) {
  const { orderNumber } = await params;
  const { guestToken } = await searchParams;

  type GuestOrderDetail = {
    orderNumber: string;
    shippingMethod: string;
    paymentMethod: string;
    customerNote: string | null;
    subtotal: string;
    discountAmount: string;
    shippingAmount: string;
    taxAmount: string;
    totalAmount: string;
    shippingAddressSnapshot: {
      firstName: string;
      lastName: string;
      company: string | null;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      state: string | null;
      postalCode: string;
      countryCode: string;
      phone: string | null;
    };
    billingAddressSnapshot: {
      firstName: string;
      lastName: string;
      company: string | null;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      state: string | null;
      postalCode: string;
      countryCode: string;
      phone: string | null;
    };
    items: Array<{ id: string; productId: string; productName: string; sku: string; quantity: number; unitPrice: string; subtotal: string }>;
  };

  const guestQuery = guestToken ? `?guestToken=${encodeURIComponent(guestToken)}` : '';
  const order = await serverFetch<GuestOrderDetail>(`/api/front/orders/guest/${encodeURIComponent(orderNumber)}${guestQuery}`).catch(() => null);

  if (!order) {
    notFound();
  }

  const listing = await getProductList({ pageSize: 12, sort: 'featured', purchaseMode: 'buy' });
  const shippingAddress = order.shippingAddressSnapshot;
  const billingAddress = order.billingAddressSnapshot;
  const parsedNote = parseOrderNote(order.customerNote);
  const timing = getShippingTiming(order.shippingMethod);
  const paymentStatus = getPaymentStatus(order.paymentMethod);
  const nextSteps = [
    { title: 'Confirmed', body: 'The order snapshot is stored and ready for buyer cross-check before fulfillment starts.' },
    { title: 'Processing', body: 'Operations verifies stock, buyer references, and freight routing against the chosen incoterm.' },
    { title: 'Shipped', body: 'Tracking is attached after the carrier booking clears warehouse processing.' },
    { title: 'Delivered', body: 'Keep the order number for replenishment questions, invoice follow-up, or account registration.' },
  ];
  const recommendedProducts = listing.items
    .filter((product) => !order.items.some((item) => item.productId === product.id))
    .slice(0, 3);
  const createAccountHref = parsedNote.contactEmail ? `/register?email=${encodeURIComponent(parsedNote.contactEmail)}` : undefined;

  return (
    <StorefrontFrame
      eyebrow="Order Confirmed"
      title={`Thank you, ${shippingAddress.firstName}. Order ${order.orderNumber} received.`}
      description="This confirmation page keeps the guest checkout snapshot accessible with payment status, shipment guidance, and follow-up actions."
    >
      <section className="section">
        <div className="section-inner">
          <div className="trade-flow-grid checkout-flow-grid">
            <div className="trade-main-stack">
              <article className="info-card confirmation-hero-card">
                <div className="confirmation-badge-row">
                  <span className="product-badge">Order received</span>
                  <span className="section-description">Tracking remains pending until dispatch is booked.</span>
                </div>

                <div className="confirmation-metrics">
                  <article className="confirmation-metric">
                    <strong>Payment status</strong>
                    <span>{paymentStatus}</span>
                  </article>
                  <article className="confirmation-metric">
                    <strong>Estimated ship</strong>
                    <span>{timing.estimatedShip}</span>
                  </article>
                  <article className="confirmation-metric">
                    <strong>Estimated delivery</strong>
                    <span>{timing.estimatedDelivery}</span>
                  </article>
                  <article className="confirmation-metric">
                    <strong>Tracking</strong>
                    <span>Shared after dispatch</span>
                  </article>
                </div>

                <ConfirmationActions continueShoppingHref="/products" createAccountHref={createAccountHref} />
              </article>

              <article className="info-card checkout-step-card">
                <div className="section-header trade-card-header">
                  <div>
                    <h2 className="cart-section-title">Lines</h2>
                    <p className="section-description">Review the exact SKU and quantity snapshot recorded at checkout.</p>
                  </div>
                </div>

                <div className="confirmation-line-table">
                  <div className="confirmation-line-row is-head">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span>Line</span>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="confirmation-line-row">
                      <div>
                        <strong>{item.productName}</strong>
                        <div className="product-meta">{item.sku}</div>
                      </div>
                      <span>{item.quantity}</span>
                      <span>{formatAmount(item.unitPrice)}</span>
                      <strong>{formatAmount(item.subtotal)}</strong>
                    </div>
                  ))}
                </div>

                {parsedNote.narrative ? (
                  <div className="checkout-summary-note">
                    <strong>Warehouse note</strong>
                    <p className="section-description" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                      {parsedNote.narrative}
                    </p>
                  </div>
                ) : null}
              </article>

              <article className="info-card checkout-step-card">
                <div className="section-header trade-card-header">
                  <div>
                    <h2 className="cart-section-title">What happens next</h2>
                    <p className="section-description">The post-order path mirrors the handoff buyers typically expect after a small wholesale checkout.</p>
                  </div>
                </div>

                <div className="confirmation-next-grid">
                  {nextSteps.map((step, index) => (
                    <article key={step.title} className="confirmation-next-card">
                      <strong>Step {index + 1}</strong>
                      <h3>{step.title}</h3>
                      <p className="section-description">{step.body}</p>
                    </article>
                  ))}
                </div>
              </article>

              {order.paymentMethod === 'Wire transfer' ? (
                <article className="info-card checkout-step-card">
                  <div className="section-header trade-card-header">
                    <div>
                      <h2 className="cart-section-title">Wire instructions</h2>
                      <p className="section-description">Finance follow-up is staged for wire orders without inventing bank details in the storefront.</p>
                    </div>
                  </div>

                  <div className="support-list">
                    <div className="support-item">
                      <span className="support-bullet" />
                      <span>Use {order.orderNumber} as the remittance reference when your finance team receives the bank sheet.</span>
                    </div>
                    <div className="support-item">
                      <span className="support-bullet" />
                      <span>Operations will confirm the beneficiary instructions and shipment release timing after order review.</span>
                    </div>
                  </div>
                </article>
              ) : null}

              {parsedNote.poNumber ? (
                <article className="info-card checkout-step-card">
                  <div className="section-header trade-card-header">
                    <div>
                      <h2 className="cart-section-title">PO acknowledgement</h2>
                      <p className="section-description">The purchase order reference is attached to the buyer-facing record and stays visible for future support.</p>
                    </div>
                  </div>

                  <div className="checkout-summary-note">
                    <strong>{parsedNote.poNumber}</strong>
                    <span className="section-description">Keep this confirmation page available until the finance and receiving teams have cross-checked the PO reference.</span>
                  </div>
                </article>
              ) : null}

              {recommendedProducts.length ? (
                <article className="info-card checkout-step-card">
                  <div className="section-header trade-card-header">
                    <div>
                      <h2 className="cart-section-title">Often paired with this order</h2>
                      <p className="section-description">Accessory and support products to continue the catalog path without leaving the confirmation flow.</p>
                    </div>
                  </div>

                  <div className="confirmation-cross-sell-grid">
                    {recommendedProducts.map((product) => (
                      <article key={product.id} className="confirmation-cross-sell-card">
                        <strong>{product.name}</strong>
                        <span className="product-meta">{product.sku}</span>
                        <p className="section-description">{product.shortDescription}</p>
                        <div className="address-choice-head">
                          <strong>{product.price.formatted}</strong>
                          <Link href={`/products/${product.slug}`} className="nav-link">
                            View product
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              ) : null}
            </div>

            <aside className="trade-side-stack">
              <article className="info-card checkout-summary-card confirmation-support-card">
                <div>
                  <h2 className="cart-section-title" style={{ marginTop: 0 }}>Shipment summary</h2>
                  <div className="section-description">
                    <div>
                      {shippingAddress.firstName} {shippingAddress.lastName}
                    </div>
                    {shippingAddress.company ? <div>{shippingAddress.company}</div> : null}
                    <div>{shippingAddress.addressLine1}</div>
                    {shippingAddress.addressLine2 ? <div>{shippingAddress.addressLine2}</div> : null}
                    <div>
                      {shippingAddress.city}
                      {shippingAddress.state ? `, ${shippingAddress.state}` : ''} {shippingAddress.postalCode}
                    </div>
                    <div>{shippingAddress.countryCode}</div>
                    {shippingAddress.phone ? <div>{shippingAddress.phone}</div> : null}
                  </div>
                  <div className="checkout-summary-note">
                    <strong>{order.shippingMethod}</strong>
                    <span className="section-description">{parsedNote.tradeTerm ?? 'Incoterm confirmed during order review'}</span>
                  </div>
                </div>

                <div>
                  <h2 className="cart-section-title" style={{ marginTop: 0 }}>Billing summary</h2>
                  <div className="section-description">
                    <div>
                      {billingAddress.firstName} {billingAddress.lastName}
                    </div>
                    {billingAddress.company ? <div>{billingAddress.company}</div> : null}
                    <div>{billingAddress.addressLine1}</div>
                    {billingAddress.addressLine2 ? <div>{billingAddress.addressLine2}</div> : null}
                    <div>
                      {billingAddress.city}
                      {billingAddress.state ? `, ${billingAddress.state}` : ''} {billingAddress.postalCode}
                    </div>
                    <div>{billingAddress.countryCode}</div>
                    {billingAddress.phone ? <div>{billingAddress.phone}</div> : null}
                  </div>
                </div>

                <div className="cart-summary-list">
                  <div className="cart-summary-row"><span className="section-description">Payment method</span><strong>{order.paymentMethod}</strong></div>
                  <div className="cart-summary-row"><span className="section-description">Subtotal</span><strong>{formatAmount(order.subtotal)}</strong></div>
                  {Number(order.discountAmount) > 0 ? <div className="cart-summary-row"><span className="section-description">Discount</span><strong>-{formatAmount(order.discountAmount)}</strong></div> : null}
                  <div className="cart-summary-row"><span className="section-description">Shipping</span><strong>{formatAmount(order.shippingAmount)}</strong></div>
                  <div className="cart-summary-row"><span className="section-description">Tax</span><strong>{formatAmount(order.taxAmount)}</strong></div>
                  <div className="cart-summary-row is-total"><span>Total</span><strong>{formatAmount(order.totalAmount)}</strong></div>
                </div>

                {parsedNote.requestedShipDate || parsedNote.taxId || parsedNote.contactEmail ? (
                  <div className="checkout-summary-note">
                    {parsedNote.requestedShipDate ? <span className="section-description">Requested ship date: {parsedNote.requestedShipDate}</span> : null}
                    {parsedNote.taxId ? <span className="section-description">Tax ID / VAT: {parsedNote.taxId}</span> : null}
                    {parsedNote.contactEmail ? <span className="section-description">Contact email: {parsedNote.contactEmail}</span> : null}
                  </div>
                ) : null}

                <div className="support-list">
                  <div className="support-item">
                    <span className="support-bullet" />
                    <span>Support line: +1-518-722-7315</span>
                  </div>
                  <div className="support-item">
                    <span className="support-bullet" />
                    <span>WhatsApp: +86-19952400441</span>
                  </div>
                  <div className="support-item">
                    <span className="support-bullet" />
                    <span><Link href="/support" className="section-link">Help Center</Link> and <Link href="/contact" className="section-link">Contact us</Link> stay available for post-order questions.</span>
                  </div>
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </StorefrontFrame>
  );
}