'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/components/providers/auth-provider';
import { apiFetch } from '@/lib/api-client';
import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { accountDashboardTodos, accountQuoteRecords, accountRecommendedProductSlugs, accountSavedLists } from '@/lib/account-portal';
import type { StorefrontProductDetail } from '@/lib/storefront-types';

type AccountSummary = {
  orders: number;
  addresses: number;
  inquiries: number;
  wishlist: number;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: unknown;
  placedAt: string | null;
};

export default function AccountPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<StorefrontProductDetail[]>([]);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      try {
        const [summaryData, orders] = await Promise.all([
          apiFetch<AccountSummary>('/api/front/account/summary'),
          apiFetch<OrderRow[]>('/api/front/orders'),
        ]);
        setSummary(summaryData);
        setRecentOrders(orders.slice(0, 5));
      } catch {
        setSummary({ orders: 0, addresses: 0, inquiries: 0, wishlist: 0 });
        setRecentOrders([]);
      }

      const products = (
        await Promise.all(
          accountRecommendedProductSlugs.map((slug) =>
            apiFetch<StorefrontProductDetail>(`/api/front/products/${encodeURIComponent(slug)}`).catch(() => null),
          ),
        )
      ).filter((product): product is StorefrontProductDetail => product !== null);
      setRecommendedProducts(products);
    })();
  }, [user]);

  if (!user) {
    return null;
  }

  const highlightPending = searchParams.get('pendingReview') === '1';
  const pendingQuotes = accountQuoteRecords.filter((quote) => quote.status === 'Submitted' || quote.status === 'Quoted' || quote.status === 'Negotiating');

  return (
    <div className="account-panel-stack">
      {user.status === 'pending' || highlightPending ? (
        <article className="account-review-banner" aria-live="polite">
          <strong>Account pending review</strong>
          <p className="section-description">Your business account is active for sign-in and sourcing history, but pricing and approval-dependent capabilities remain in review. Approval normally lands within one working day.</p>
        </article>
      ) : null}
      <div className="section-header">
        <div>
          <h1 className="section-title">My Account</h1>
          <p className="section-description">
            Hi {user.firstName} {user.lastName}. {user.company ?? 'Your company profile'} is now tied to order history, quote follow-up, saved lists, downloads, invoices, and buyer-level settings.
          </p>
        </div>
      </div>
      <div className="account-kpi-grid">
        <Link href="/account/orders" className="summary-stat knowledge-product-card">
          <span className="summary-label">Open orders</span>
          <strong>{summary?.orders ?? 0}</strong>
          <span className="section-description compact-copy">View all orders</span>
        </Link>
        <Link href="/account/quotes" className="summary-stat knowledge-product-card">
          <span className="summary-label">Pending quotes</span>
          <strong>{pendingQuotes.length}</strong>
          <span className="section-description compact-copy">Quoted and negotiating programs</span>
        </Link>
        <Link href="/cart" className="summary-stat knowledge-product-card">
          <span className="summary-label">Items in cart</span>
          <strong>—</strong>
          <span className="section-description compact-copy">Open cart and checkout draft</span>
        </Link>
        <Link href="/account/company" className="summary-stat knowledge-product-card">
          <span className="summary-label">Credit available</span>
          <strong>$18,400</strong>
          <span className="section-description compact-copy">Net30 account headroom</span>
        </Link>
      </div>

      <div className="info-grid">
        <article className="info-card">
          <div className="card-kicker">Recent orders</div>
          <h2>Latest purchase activity</h2>
          {recentOrders.length ? (
            <div className="account-order-list">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/account/orders/${order.orderNumber}`} className="account-order-row">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <div className="section-description compact-copy">{order.status}</div>
                  </div>
                  <span>{order.placedAt ? new Date(order.placedAt).toLocaleDateString() : '—'}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="section-description">No orders yet.</p>
          )}
        </article>

        <article className="info-card">
          <div className="card-kicker">Recommended products</div>
          <h2>Reorder-friendly catalog picks</h2>
          <div className="account-product-grid">
            {recommendedProducts.map((product) => (
              <div key={product.id} className="knowledge-product-card">
                <Link href={`/products/${product.slug}`} className="section-link">
                  {product.name}
                </Link>
                <div className="section-description compact-copy">{product.sku}</div>
                <AddToCartButton productId={product.id} moq={product.moq} />
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="info-grid">
        <article className="info-card">
          <div className="card-kicker">Saved lists</div>
          <h2>BOM and repeat-buy lists</h2>
          <div className="account-list-grid">
            {accountSavedLists.map((list) => (
              <Link key={list.id} href={`/account/lists/${list.id}`} className="knowledge-product-card">
                <strong>{list.name}</strong>
                <div className="section-description compact-copy">{list.itemCount} items · {list.description}</div>
              </Link>
            ))}
          </div>
        </article>

        <article className="info-card">
          <div className="card-kicker">Action center</div>
          <h2>What needs attention</h2>
          <ul className="account-todo-list">
            {accountDashboardTodos.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="section-link">
                  {item.title}
                </Link>
                <span className="section-description compact-copy">{item.detail}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
