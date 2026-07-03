'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@C/toast';
import { usePdpBuyOptional } from '@/components/storefront/pdp-buy-panel';
import {
  QUOTE_ITEMS_UPDATED_EVENT,
  addQuoteItem,
  isProductInQuote,
} from '@/lib/quote-live-items';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';

type AddToQuoteButtonProps = {
  productId: string;
  name: string;
  slug: string;
  spu: string;
  coverImage?: { url: string; alt: string } | null;
  listUnitPrice?: { amount: number; currency: string; formatted: string };
  className?: string;
  quantity?: number;
  bar?: boolean;
  label?: string;
};

function QuoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

export function AddToQuoteButton({
  productId,
  name,
  slug,
  spu,
  coverImage,
  listUnitPrice,
  className,
  quantity: quantityProp,
  bar = false,
  label,
}: AddToQuoteButtonProps) {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const pdpBuy = usePdpBuyOptional();
  const [isAdding, setIsAdding] = useState(false);
  const [isInQuote, setIsInQuote] = useState(false);

  const syncQuoteState = useCallback(() => {
    setIsInQuote(isProductInQuote(productId));
  }, [productId]);

  useEffect(() => {
    syncQuoteState();
    window.addEventListener(QUOTE_ITEMS_UPDATED_EVENT, syncQuoteState);
    window.addEventListener('storage', syncQuoteState);
    return () => {
      window.removeEventListener(QUOTE_ITEMS_UPDATED_EVENT, syncQuoteState);
      window.removeEventListener('storage', syncQuoteState);
    };
  }, [syncQuoteState]);

  const baseClassName = className ?? (bar ? 'catalog-add-to-cart-bar catalog-add-to-cart-bar-secondary' : 'button-secondary pdp-quote-button storefront-toggle-btn');
  const resolvedClassName = `${baseClassName}${isInQuote ? ' is-added' : ''}`;
  const buttonLabel = label ?? t('product.addToQuote');
  const displayLabel = isInQuote ? t('product.inQuote') : buttonLabel;

  function handleAddToQuote() {
    if (isAdding || isInQuote) {
      return;
    }

    setIsAdding(true);
    const quantity = quantityProp ?? pdpBuy?.quantity ?? 1;

    addQuoteItem(
      {
        id: productId,
        name,
        slug,
        spu,
        coverImage: coverImage ?? null,
        listUnitPrice,
      },
      quantity,
    );

    setIsInQuote(true);

    const locale = parseLocaleFromPathname(pathname).locale;
    pushToast({
      title: t('product.addToQuote'),
      description: `${spu} · ${t('product.quantity')} ${quantity}`,
      tone: 'success',
      actionLabel: t('header.quotes'),
      actionHref: withLocalePath('/quote', locale),
    });

    setIsAdding(false);
  }

  return (
    <button
      type="button"
      className={resolvedClassName}
      onClick={handleAddToQuote}
      disabled={isAdding || isInQuote}
      aria-pressed={isInQuote}
    >
      {isInQuote ? (
        <span className="storefront-toggle-btn-inner">
          <QuoteIcon className="storefront-toggle-btn-icon" />
          {displayLabel}
        </span>
      ) : isAdding ? (
        t('common.loading')
      ) : (
        displayLabel
      )}
    </button>
  );
}

export function AddToQuoteLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
