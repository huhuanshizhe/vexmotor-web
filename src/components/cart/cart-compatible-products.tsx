'use client';

import Image from 'next/image';
import Link from 'next/link';

import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';
import { productSpuBadge } from '@/lib/product-spu';
import type { StorefrontProductCard } from '@/lib/storefront-types';

type CartCompatibleProductsProps = {
  products: StorefrontProductCard[];
  locale: Locale;
  title: string;
  requestQuoteLabel: string;
};

export function CartCompatibleProducts({ products, locale, title, requestQuoteLabel }: CartCompatibleProductsProps) {
  if (!products.length) {
    return null;
  }

  return (
    <article className="cart-recommendations-panel" aria-label={title}>
      <h3 className="cart-compatible-heading">{title}</h3>
      <ul className="cart-compatible-grid">
        {products.map((item) => (
          <li key={item.id}>
            <article className="cart-compatible-card">
              <Link href={withLocalePath(`/products/${item.slug}`, locale)} className="cart-compatible-media">
                {item.coverImage ? (
                  <Image
                    src={item.coverImage.url}
                    alt={item.coverImage.alt || item.name}
                    fill
                    sizes="88px"
                    unoptimized
                    className="cart-compatible-image"
                  />
                ) : (
                  <span className="cart-compatible-fallback" title={`SPU ${item.spu || '—'}`}>
                    {productSpuBadge(item)}
                  </span>
                )}
              </Link>
              <div className="cart-compatible-body">
                <Link href={withLocalePath(`/products/${item.slug}`, locale)} className="cart-compatible-title">
                  {item.name}
                </Link>
                <span className="cart-compatible-spu">SPU {item.spu || '—'}</span>
                <div className="cart-compatible-foot">
                  <strong className="cart-compatible-price">
                    {item.purchaseMode === 'buy' ? item.price.formatted : requestQuoteLabel}
                  </strong>
                  {item.purchaseMode === 'buy' ? (
                    <AddToCartButton productId={item.id} redirectToCart={false} compact />
                  ) : (
                    <Link href={withLocalePath(`/products/${item.slug}`, locale)} className="cart-compatible-link">
                      {requestQuoteLabel}
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </article>
  );
}
