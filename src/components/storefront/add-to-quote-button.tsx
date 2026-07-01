'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { useToast } from '@C/toast';
import { usePdpBuyOptional } from '@/components/storefront/pdp-buy-panel';
import { addQuoteItem } from '@/lib/quote-live-items';
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
};

export function AddToQuoteButton({
  productId,
  name,
  slug,
  spu,
  coverImage,
  listUnitPrice,
  className = 'button-secondary pdp-quote-button',
  quantity: quantityProp,
}: AddToQuoteButtonProps) {
  const pathname = usePathname();
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const pdpBuy = usePdpBuyOptional();
  const [isAdding, setIsAdding] = useState(false);

  function handleAddToQuote() {
    if (isAdding) {
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
    <button type="button" className={className} onClick={handleAddToQuote} disabled={isAdding}>
      {isAdding ? t('common.loading') : t('product.addToQuote')}
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
