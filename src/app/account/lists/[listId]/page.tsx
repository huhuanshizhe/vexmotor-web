import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { getAccountSavedListById } from '@/lib/account-portal';
import { getProductBySlug } from '@/lib/storefront-api';

type AccountListDetailPageProps = {
  params: Promise<{ listId: string }>;
};

export default async function AccountListDetailPage({ params }: AccountListDetailPageProps) {
  const { listId } = await params;
  const list = getAccountSavedListById(listId);

  if (!list) {
    notFound();
  }

  const products = await Promise.all(list.items.map((item) => getProductBySlug(item.productSlug)));
  const productBySlug = new Map(products.filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => [item.slug, item]));

  return (
    <div className="account-panel-stack">
      <div className="section-header">
        <div>
          <h1 className="section-title">{list.name}</h1>
          <p className="section-description">{list.description}</p>
        </div>
        <div className="account-inline-actions">
          <span className="product-badge">{list.scope}</span>
          <span className="product-meta">Updated {list.updatedAt}</span>
        </div>
      </div>

      <article className="info-card">
        <div className="trade-empty-actions">
          <Link href="/cart" className="button-primary">Add all to cart</Link>
          <Link href="/sample" className="button-secondary">Add all to sample</Link>
          <Link href="/quote" className="button-secondary">Add all to quote</Link>
          <Link href="/account/lists" className="button-secondary">Duplicate / delete</Link>
        </div>
      </article>

      <article className="info-card account-table-card">
        <div className="account-list-row account-list-head">
          <span>SKU</span>
          <span>Qty</span>
          <span>Note</span>
          <span>Stock</span>
          <span>Price</span>
          <span>Actions</span>
        </div>
        {list.items.map((item) => {
          const product = productBySlug.get(item.productSlug) ?? null;

          return (
            <div key={item.sku} className="account-list-row">
              <div>
                <strong>{item.sku}</strong>
                <div className="section-description compact-copy">{product?.name ?? item.productSlug}</div>
              </div>
              <span>{item.quantity}</span>
              <span>{item.note}</span>
              <span>{item.stockLabel}</span>
              <span>{item.priceLabel}</span>
              <div className="account-inline-actions">
                {product ? <AddToCartButton productId={product.id} redirectToCart={false} /> : null}
                <Link href={`/products/${item.productSlug}`} className="nav-link">Open</Link>
              </div>
            </div>
          );
        })}
      </article>
    </div>
  );
}