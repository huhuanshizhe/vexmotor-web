'use client';

import { useEffect, useState } from 'react';

import { type CompareItem, readCompareItems, upsertCompareItem } from '@/lib/compare-items';
import { useTranslation } from '@/lib/i18n-context';

type AddToCompareButtonProps = {
  item: CompareItem;
  compact?: boolean;
  icon?: boolean;
};

function CompareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="8" rx="0.5" />
      <rect x="14" y="6" width="3" height="12" rx="0.5" />
    </svg>
  );
}

export function AddToCompareButton({ item, compact = false, icon = false }: AddToCompareButtonProps) {
  const { t } = useTranslation();
  const [isAdded, setIsAdded] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsAdded(readCompareItems().some((entry) => entry.id === item.id));
  }, [item.id]);

  function handleCompare() {
    upsertCompareItem(item);
    setIsAdded(true);
    setMessage(t('product.addToCompare'));
  }

  if (icon) {
    return (
      <button
        type="button"
        className={`catalog-card-icon-btn${isAdded ? ' is-active' : ''}`}
        onClick={handleCompare}
        aria-label={t('product.addToCompare')}
        title={t('product.addToCompare')}
      >
        <CompareIcon className="catalog-card-icon-svg" />
      </button>
    );
  }

  if (compact) {
    return (
      <button type="button" className="catalog-action-btn catalog-action-btn-ghost" onClick={handleCompare}>
        {isAdded ? t('compare.addToCompare') : t('product.addToCompare')}
      </button>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button type="button" className="button-secondary" onClick={handleCompare} style={{ color: 'var(--color-ink)', borderColor: 'var(--color-border)' }}>
        {isAdded ? t('compare.addToCompare') : t('product.addToCompare')}
      </button>
      {message ? <span className="section-description compact-copy">{message}</span> : null}
    </div>
  );
}
