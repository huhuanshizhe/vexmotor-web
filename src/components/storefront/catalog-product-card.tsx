import Image from 'next/image';
import Link from 'next/link';

import { AddToCartButton } from '@/components/storefront/add-to-cart-button';
import { AddToCompareButton } from '@/components/storefront/add-to-compare-button';
import { AddToQuoteButton } from '@/components/storefront/add-to-quote-button';
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

function shouldShowCardDescription(name: string, shortDescription?: string | null) {
  const description = shortDescription?.trim();
  if (!description) {
    return false;
  }

  const title = name.trim();
  if (description === title) {
    return false;
  }

  // short_description is often the same title with minor suffix/prefix differences.
  if (title.startsWith(description) || description.startsWith(title)) {
    return false;
  }

  return true;
}

export function CatalogProductCard({ product, productHref, compareCategoryName, className }: CatalogProductCardProps) {
  const cardDescription = product.shortDescription?.trim();
  const showCardDescription = shouldShowCardDescription(product.name, cardDescription);
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
        {product.purchaseMode === 'buy' ? (
          <p className="product-price catalog-grid-price">{product.price.formatted}</p>
        ) : null}
        <div className="catalog-grid-footer">
          {product.purchaseMode === 'buy' ? (
            <AddToCartButton productId={product.id} redirectToCart={false} bar />
          ) : (
            <AddToQuoteButton
              productId={product.id}
              name={product.name}
              slug={product.slug}
              spu={resolveProductSpu(product)}
              coverImage={product.coverImage ? { url: product.coverImage.url, alt: product.coverImage.alt || product.name } : null}
              listUnitPrice={{ amount: product.price.amount, currency: product.price.currency, formatted: product.price.formatted }}
              bar
              label="Request Quote"
            />
          )}
        </div>
      </div>
    </article>
  );
}
