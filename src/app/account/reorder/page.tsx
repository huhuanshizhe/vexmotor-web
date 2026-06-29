import Link from 'next/link';

import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { withLocalePath } from '@/lib/i18n';
import { getServerSitePreferences } from '@/lib/i18n-server';
import { accountReorderCandidates, accountSavedLists } from '@/lib/account-portal';
import { getProductBySlug, getProductList } from '@/lib/storefront-api';

export default async function AccountReorderPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ locale }, params] = await Promise.all([getServerSitePreferences(), searchParams]);
  const query = params.q?.trim() ?? '';
  const quickResults = query ? await getProductList({ keyword: query, page: 1, pageSize: 6 }) : null;
  const reorderProducts = await Promise.all(accountReorderCandidates.map((candidate) => getProductBySlug(candidate.productSlug)));
  const productBySlug = new Map(reorderProducts.filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => [item.slug, item]));

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">Reorder</h1>
          <p className="section-description">Move from remembered SKU to cart in seconds, or reuse a past order or saved list when the program repeats on a known cadence.</p>
        </div>
      </div>

      <article className="info-card">
        <form action={withLocalePath('/account/reorder', locale)} className="account-toolbar">
          <label className="knowledge-search-field">
            <span>Quick reorder by SKU</span>
            <input name="q" defaultValue={query} className="newsletter-input" placeholder="Search SKU or product name" />
          </label>
          <button type="submit" className="button-primary">Find SKU</button>
        </form>

        {quickResults?.items.length ? (
          <div className="account-company-grid" style={{ marginTop: 18 }}>
            {quickResults.items.map((product) => (
              <article key={product.id} className="summary-stat">
                <span className="summary-label">{product.sku}</span>
                <strong>{product.name}</strong>
                <span className="section-description compact-copy">{product.shortDescription}</span>
                <div className="account-inline-actions">
                  {product.purchaseMode === 'buy' ? <AddToCartButton productId={product.id} redirectToCart={false} /> : <Link href={withLocalePath(`/products/${product.slug}`, locale)} className="nav-link">Open RFQ</Link>}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      <article className="info-card account-table-card">
        <div className="section-header trade-card-header">
          <div>
            <div className="card-kicker">From past orders</div>
            <h2 className="cart-section-title">Recent reorder candidates</h2>
          </div>
        </div>
        <div className="account-table-head">
          <span>Source</span>
          <span>SKU</span>
          <span>Product</span>
          <span>Last qty</span>
          <span>Cadence</span>
          <span>Availability</span>
          <span>Action</span>
        </div>
        {accountReorderCandidates.map((candidate) => {
          const product = productBySlug.get(candidate.productSlug) ?? null;
          return (
            <div key={`${candidate.orderNumber}-${candidate.sku}`} className="account-table-row">
              <div>
                <strong>{candidate.source}</strong>
                <div className="product-meta">{candidate.orderNumber}</div>
              </div>
              <strong>{candidate.sku}</strong>
              <div>
                <strong>{candidate.productName}</strong>
                <div className="section-description compact-copy">{candidate.note}</div>
              </div>
              <span>{candidate.lastQuantity}</span>
              <span>{candidate.cadence}</span>
              <span>{candidate.availability}</span>
              <div className="account-inline-actions">
                {product ? <AddToCartButton productId={product.id} redirectToCart={false} /> : null}
                <Link href={withLocalePath(`/products/${candidate.productSlug}`, locale)} className="nav-link">Open</Link>
              </div>
            </div>
          );
        })}
      </article>

      <article className="info-card">
        <div className="section-header trade-card-header">
          <div>
            <div className="card-kicker">From saved lists</div>
            <h2 className="cart-section-title">BOM shortcuts</h2>
          </div>
        </div>
        <div className="account-company-grid">
          {accountSavedLists.map((list) => (
            <article key={list.id} className="summary-stat">
              <span className="summary-label">{list.scope}</span>
              <strong>{list.name}</strong>
              <span className="section-description compact-copy">{list.itemCount} items · updated {list.updatedAt}</span>
              <div className="account-inline-actions">
                <Link href={withLocalePath(`/account/lists/${list.id}`, locale)} className="nav-link">Open BOM</Link>
                <Link href={withLocalePath('/cart', locale)} className="nav-link">Add all to cart</Link>
              </div>
            </article>
          ))}
        </div>
      </article>
    </div>
  );
}