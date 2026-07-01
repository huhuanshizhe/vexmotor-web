'use client';

import Link from 'next/link';

import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type QuoteLineItemProps = {
  locale: Locale;
  name: string;
  slug: string;
  spu: string;
  quantity: number;
  overlay?: boolean;
  coverImage?: { url: string; alt: string } | null;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onPreviewImage: (image: { url: string; alt: string }) => void;
};

export function QuoteLineItem({
  locale,
  name,
  slug,
  spu,
  quantity,
  overlay,
  coverImage,
  onQuantityChange,
  onRemove,
  onPreviewImage,
}: QuoteLineItemProps) {
  return (
    <article className="quote-rfq-line">
      {coverImage ? (
        <button
          type="button"
          className="quote-rfq-line__thumb"
          onClick={() => onPreviewImage({ url: coverImage.url, alt: coverImage.alt || name })}
          aria-label={`Preview image for ${name}`}
        >
          <img src={coverImage.url} alt={coverImage.alt || name} />
          <span className="quote-rfq-line__thumb-zoom" aria-hidden="true">⌕</span>
        </button>
      ) : (
        <span className="quote-rfq-line__thumb quote-rfq-line__thumb--empty" aria-hidden="true" />
      )}

      <div className="quote-rfq-line__content">
        <div className="quote-rfq-line__head">
          <Link href={withLocalePath(`/products/${slug}`, locale)} className="quote-rfq-line__title" target="_blank" rel="noreferrer">
            {name}
          </Link>
          <p className="quote-rfq-line__spu">
            SPU {spu}
            {overlay ? <span className="quote-rfq-line__badge">From cart</span> : null}
          </p>
        </div>

        <div className="quote-rfq-line__toolbar">
          <div className="quote-rfq-line__qty-group">
            <span className="quote-rfq-line__qty-label">Qty</span>
            <div className="quantity-stepper quote-rfq-line__stepper">
              <button type="button" className="quantity-stepper-button" onClick={() => onQuantityChange(quantity - 1)} disabled={quantity <= 1}>
                −
              </button>
              <input
                type="number"
                min={1}
                className="quantity-stepper-input"
                value={quantity}
                onChange={(event) => onQuantityChange(Number(event.target.value) || 1)}
                aria-label={`Quantity for ${spu}`}
              />
              <button type="button" className="quantity-stepper-button" onClick={() => onQuantityChange(quantity + 1)}>
                +
              </button>
            </div>
          </div>
          <button type="button" className="quote-rfq-line__remove" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
