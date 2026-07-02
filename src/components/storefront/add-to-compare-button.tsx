'use client';

import { useCallback, useEffect, useState } from 'react';

import { useToast } from '@C/toast';
import { useAuth } from '@/components/providers/auth-provider';
import { addCompareItemRemote } from '@/lib/compare-api';
import {
  type CompareItem,
  COMPARE_ITEMS_UPDATED_EVENT,
  addCompareItem,
  isProductInCompare,
  readCompareItems,
} from '@/lib/compare-items';
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
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isAdded, setIsAdded] = useState(false);

  const syncAddedState = useCallback(() => {
    setIsAdded(isProductInCompare(item.id));
  }, [item.id]);

  useEffect(() => {
    syncAddedState();
    window.addEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncAddedState);
    window.addEventListener('storage', syncAddedState);
    return () => {
      window.removeEventListener(COMPARE_ITEMS_UPDATED_EVENT, syncAddedState);
      window.removeEventListener('storage', syncAddedState);
    };
  }, [syncAddedState]);

  function handleCompare() {
    if (isAdded) {
      return;
    }

    const result = addCompareItem(item);
    if (result.added) {
      setIsAdded(true);
      if (user) {
        void addCompareItemRemote(item.id).catch(() => undefined);
      }
      pushToast({
        title: t('product.addToCompare'),
        description: t('compare.addedToast', { spu: item.spu }),
        tone: 'success',
      });
      return;
    }

    if (result.reason === 'full') {
      pushToast({
        title: t('compare.maxItems'),
        description: t('compare.maxItems'),
        tone: 'error',
        persistent: true,
      });
      return;
    }

    setIsAdded(true);
  }

  const label = isAdded ? t('compare.inCompare') : t('product.addToCompare');

  if (icon) {
    return (
      <button
        type="button"
        className={`catalog-card-icon-btn${isAdded ? ' is-active' : ''}`}
        onClick={handleCompare}
        disabled={isAdded}
        aria-label={label}
        aria-pressed={isAdded}
        title={label}
      >
        <CompareIcon className="catalog-card-icon-svg" />
      </button>
    );
  }

  if (compact) {
    return (
      <button type="button" className={`catalog-action-btn catalog-action-btn-ghost${isAdded ? ' is-added' : ''}`} onClick={handleCompare} disabled={isAdded} aria-pressed={isAdded}>
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`button-secondary storefront-toggle-btn${isAdded ? ' is-added' : ''}`}
      onClick={handleCompare}
      disabled={isAdded}
      aria-pressed={isAdded}
    >
      {isAdded ? (
        <span className="storefront-toggle-btn-inner">
          <CompareIcon className="storefront-toggle-btn-icon" />
          {label}
        </span>
      ) : (
        label
      )}
    </button>
  );
}
