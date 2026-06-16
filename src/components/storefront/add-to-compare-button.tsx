'use client';

import { useEffect, useState } from 'react';

import { type CompareItem, readCompareItems, upsertCompareItem } from '@/lib/compare-items';
import { useTranslation } from '@/lib/i18n-context';

type AddToCompareButtonProps = {
  item: CompareItem;
};

export function AddToCompareButton({ item }: AddToCompareButtonProps) {
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

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <button type="button" className="button-secondary" onClick={handleCompare} style={{ color: 'var(--color-ink)', borderColor: 'var(--color-border)' }}>
        {isAdded ? t('compare.addToCompare') : t('product.addToCompare')}
      </button>
      {message ? <span className="section-description compact-copy">{message}</span> : null}
    </div>
  );
}