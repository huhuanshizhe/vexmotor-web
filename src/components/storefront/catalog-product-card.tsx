import Image from 'next/image';
import Link from 'next/link';

import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import { AddToWishlistButton } from '@/components/storefront/add-to-wishlist-button';
import { CatalogProductCardTitle } from '@/components/storefront/catalog-product-card-title';
import { resolveProductSpu } from '@/lib/product-spu';
import type { StorefrontProductCard } from '@/lib/storefront-types';

type CatalogProductCardProps = {
  product: StorefrontProductCard;
  productHref: string;
  compareCategoryName?: string;
  className?: string;
};

export function CatalogProductCard({ product, productHref, compareCategoryName, className }: CatalogProductCardProps) {
  const cardDescription = product.shortDescription?.trim();
  const showCardDescription = Boolean(cardDescription && cardDescription !== product.name.trim());
  const cardClassName = className ? `product-card catalog-grid-card ${className}` : 'product-card catalog-grid-card';

  return (
    <article className={cardClassName}>
      <div className="product-card-top catalog-grid-card-top">
        <span className="product-badge">{product.inStock ? 'In Stock' : 'Lead time on request'}</span>
        <div className="catalog-card-icon-actions">
          <AddToWishlistButton productId={product.id} icon />
          <AddToCompareButton
            icon
            item={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              spu: resolveProductSpu(product),
              priceLabel: product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote',
              purchaseMode: product.purchaseMode,
              inStock: product.inStock,
              shortDescription: product.shortDescription,
              categories: compareCategoryName ? [compareCategoryName] : [],
            }}
          />
        </div>
      </div>
      <div className="catalog-grid-media-shell">
        {product.coverImage ? (
          <Link href={productHref} className="product-card-media catalog-grid-media">
            <Image
              src={product.coverImage.url}
              alt={product.coverImage.alt || product.name}
              fill
              sizes="320px"
              unoptimized
              className="catalog-grid-image"
            />
          </Link>
        ) : (
          <span className="catalog-grid-media-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="catalog-grid-card-body">
        <CatalogProductCardTitle href={productHref} name={product.name} />
        <p className="catalog-grid-spu">
          <span className="catalog-grid-spu-label">SPU</span>
          {product.spu}
        </p>
        {showCardDescription ? (
          <p className="section-description compact-copy catalog-grid-card-description">{cardDescription}</p>
        ) : null}
        <p className="product-price catalog-grid-price">
          {product.purchaseMode === 'buy' ? product.price.formatted : 'Request Quote'}
        </p>
        <div className="catalog-grid-footer">
          {product.purchaseMode === 'buy' ? (
            <AddToCartButton productId={product.id} redirectToCart={false} bar />
          ) : (
            <Link href={productHref} className="catalog-add-to-cart-bar catalog-add-to-cart-bar-secondary">
              Request Quote
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
