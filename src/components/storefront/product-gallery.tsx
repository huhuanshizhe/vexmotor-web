'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import type { StorefrontImage } from '@/lib/storefront-api';

type ProductGalleryProps = {
  images: StorefrontImage[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sanitizedImages = useMemo(() => images.filter((image) => image.url), [images]);
  const [activeImageId, setActiveImageId] = useState<string | null>(sanitizedImages[0]?.id ?? null);

  const activeImage = sanitizedImages.find((image) => image.id === activeImageId) ?? sanitizedImages[0] ?? null;
  const activeIndex = activeImage ? sanitizedImages.findIndex((image) => image.id === activeImage.id) : -1;

  if (!activeImage) {
    return (
      <article className="info-card product-gallery-shell">
        <div className="product-gallery-empty">
          <span className="card-kicker">Media unavailable</span>
          <h2 style={{ margin: 0 }}>No product media uploaded yet.</h2>
          <p className="section-description">{productName} is available, but the gallery is still being prepared by the merchandising team.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="info-card product-gallery-shell">
      <div className="product-gallery-stage">
        <Image
          src={activeImage.url}
          alt={activeImage.alt || productName}
          fill
          sizes="(max-width: 820px) 100vw, 55vw"
          className="product-gallery-image"
          priority
          unoptimized
        />
        <div className="product-gallery-stage-meta">
          <span className="product-badge">Engineering media</span>
          <span className="product-status">
            Image {activeIndex + 1} / {sanitizedImages.length}
          </span>
        </div>
      </div>

      {sanitizedImages.length > 1 ? (
        <div className="product-gallery-thumbs" aria-label="Product gallery thumbnails">
          {sanitizedImages.map((image) => {
            const isActive = image.id === activeImage.id;
            return (
              <button
                key={image.id}
                type="button"
                className={`product-gallery-thumb${isActive ? ' is-active' : ''}`}
                onClick={() => setActiveImageId(image.id)}
                aria-pressed={isActive}
                aria-label={`Show image ${sanitizedImages.findIndex((item) => item.id === image.id) + 1}`}
              >
                <Image src={image.url} alt={image.alt || productName} fill sizes="96px" className="product-gallery-thumb-image" unoptimized />
              </button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}