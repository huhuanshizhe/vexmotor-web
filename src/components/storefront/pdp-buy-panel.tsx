'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from 'react';

import { useToast } from '@C/toast';
import { apiFetch } from '@/lib/api-client';
import { notifyCartUpdatedFromResponse, type CartApiSnapshot } from '@/lib/cart-session';
import type { VolumePricingRuleConfig } from '@/lib/commerce-config';
import { parseLocaleFromPathname, withLocalePath } from '@/lib/i18n';
import { useTranslation } from '@/lib/i18n-context';
import {
  buildVolumePricingTiers,
  getBulkVolumeTierForQuantity,
  getNextVolumeTier,
  getRetailVolumeTier,
  type VolumePricingTier,
} from '@/lib/volume-pricing';

type PdpBuyContextValue = {
  productId: string;
  moq: number;
  inStock: boolean;
  quantity: number;
  qtyInput: string;
  isQtyEditing: boolean;
  updateQuantity: (nextQuantity: number) => void;
  beginQtyEdit: () => void;
  changeQtyInput: (value: string) => void;
  commitQtyInput: () => void;
  applyTier: (tier: VolumePricingTier) => void;
  isPending: boolean;
  message: string | null;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  tiers: VolumePricingTier[];
  bulkTiers: VolumePricingTier[];
  activeTier: VolumePricingTier;
  previewTier: VolumePricingTier;
  displayTier: VolumePricingTier;
  matchedBulkTier: VolumePricingTier | null;
  previewQuantity: number;
  nextTier: ReturnType<typeof getNextVolumeTier>;
  isVolumeTierActive: boolean;
  retailTier: VolumePricingTier;
};

const PdpBuyContext = createContext<PdpBuyContextValue | null>(null);

function usePdpBuy() {
  const context = useContext(PdpBuyContext);
  if (!context) {
    throw new Error('PdpBuy components must be used within PdpBuyProvider');
  }
  return context;
}

function parseQtyInput(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeQuantity(value: number, moq: number) {
  return Math.max(moq, value);
}

type PdpBuyProviderProps = {
  productId: string;
  moq: number;
  inStock: boolean;
  basePriceAmount: number;
  currency: string;
  volumePricingRules: VolumePricingRuleConfig[];
  children: ReactNode;
};

export function PdpBuyProvider({
  productId,
  moq,
  inStock,
  basePriceAmount,
  currency,
  volumePricingRules,
  children,
}: PdpBuyProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const initialQuantity = Math.max(1, moq);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [qtyInput, setQtyInput] = useState(String(initialQuantity));
  const [isQtyEditing, setIsQtyEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tiers = useMemo(
    () => buildVolumePricingTiers(basePriceAmount, currency, volumePricingRules),
    [basePriceAmount, currency, volumePricingRules],
  );
  const bulkTiers = tiers.filter((tier) => tier.minQuantity > 1);
  const retailTier = useMemo(
    () => getRetailVolumeTier(basePriceAmount, currency, volumePricingRules),
    [basePriceAmount, currency, volumePricingRules],
  );
  const previewQuantity = useMemo(() => {
    if (!isQtyEditing) {
      return quantity;
    }
    const parsed = parseQtyInput(qtyInput);
    if (parsed === null) {
      return quantity;
    }
    return normalizeQuantity(parsed, moq);
  }, [isQtyEditing, qtyInput, quantity, moq]);

  const matchedBulkTier = useMemo(
    () => getBulkVolumeTierForQuantity(basePriceAmount, currency, previewQuantity, volumePricingRules),
    [basePriceAmount, currency, previewQuantity, volumePricingRules],
  );
  const activeBulkTier = useMemo(
    () => getBulkVolumeTierForQuantity(basePriceAmount, currency, quantity, volumePricingRules),
    [basePriceAmount, currency, quantity, volumePricingRules],
  );
  const previewTier = matchedBulkTier ?? retailTier;
  const activeTier = activeBulkTier ?? retailTier;
  const nextTier = getNextVolumeTier(basePriceAmount, currency, previewQuantity, volumePricingRules);
  const isVolumeTierActive = matchedBulkTier !== null;
  const displayTier = isVolumeTierActive ? matchedBulkTier : retailTier;

  function commitQuantity(nextQuantity: number) {
    const normalized = normalizeQuantity(nextQuantity, moq);
    setQuantity(normalized);
    setQtyInput(String(normalized));
    setIsQtyEditing(false);
    return normalized;
  }

  function updateQuantity(nextQuantity: number) {
    commitQuantity(nextQuantity);
  }

  function beginQtyEdit() {
    setIsQtyEditing(true);
    setQtyInput(String(quantity));
  }

  function changeQtyInput(value: string) {
    setIsQtyEditing(true);
    setQtyInput(value);
  }

  function commitQtyInput() {
    const parsed = parseQtyInput(qtyInput);
    const nextQty = parsed ?? quantity;
    commitQuantity(nextQty);
  }

  function applyTier(tier: VolumePricingTier) {
    commitQuantity(tier.minQuantity);
  }

  function handleAddToCart() {
    const checkoutQty = isQtyEditing ? commitQuantity(parseQtyInput(qtyInput) ?? quantity) : quantity;

    startTransition(async () => {
      setMessage(null);
      try {
        const cart = await apiFetch<CartApiSnapshot>('/api/front/cart', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity: checkoutQty }),
        });
        notifyCartUpdatedFromResponse(cart);
      } catch {
        setMessage(t('common.error'));
        return;
      }

      const locale = parseLocaleFromPathname(pathname).locale;
      pushToast({
        title: t('product.addToCart'),
        description: `${checkoutQty} ${checkoutQty > 1 ? 'items' : 'item'} added.`,
        tone: 'success',
        actionLabel: t('header.cart'),
        actionHref: withLocalePath('/cart', locale),
      });
    });
  }

  function handleBuyNow() {
    const checkoutQty = isQtyEditing ? commitQuantity(parseQtyInput(qtyInput) ?? quantity) : quantity;

    startTransition(async () => {
      setMessage(null);
      const locale = parseLocaleFromPathname(pathname).locale;
      const params = new URLSearchParams({
        buyNow: '1',
        productId,
        qty: String(checkoutQty),
      });
      router.push(`${withLocalePath('/checkout', locale)}?${params.toString()}`);
    });
  }

  const value: PdpBuyContextValue = {
    productId,
    moq,
    inStock,
    quantity,
    qtyInput,
    isQtyEditing,
    updateQuantity,
    beginQtyEdit,
    changeQtyInput,
    commitQtyInput,
    applyTier,
    isPending,
    message,
    handleAddToCart,
    handleBuyNow,
    tiers,
    bulkTiers,
    activeTier,
    previewTier,
    displayTier,
    matchedBulkTier,
    previewQuantity,
    nextTier,
    isVolumeTierActive,
    retailTier,
  };

  return <PdpBuyContext.Provider value={value}>{children}</PdpBuyContext.Provider>;
}

type PdpPricePanelProps = {
  priceHeadline: string;
  compareAtPrice?: string | null;
  volumePricingHref: string;
};

export function PdpPricePanel({ priceHeadline, compareAtPrice, volumePricingHref }: PdpPricePanelProps) {
  const {
    bulkTiers,
    retailTier,
    previewTier,
    displayTier,
    previewQuantity,
    matchedBulkTier,
    applyTier,
    nextTier,
    isVolumeTierActive,
  } = usePdpBuy();

  const showTierSummary = bulkTiers.length > 0;

  return (
    <div className="product-pricing-stack pdp-price-panel">
      <div className="pdp-price-hero">
        <div className="pdp-price-hero-copy">
          <span className="pdp-price-hero-label">Unit price</span>
          <p className="product-price">{displayTier.unitPriceLabel}</p>
          {compareAtPrice ? <p className="comparison-note">Ref {compareAtPrice}</p> : null}
        </div>
        {isVolumeTierActive && displayTier.savingsPercent > 0 ? (
          <span className="pdp-price-hero-badge">Save {displayTier.savingsPercent}%</span>
        ) : (
          <span className="pdp-price-hero-badge is-muted">List</span>
        )}
      </div>

      {showTierSummary ? (
        <div className="pdp-vol-panel">
          <div className="pdp-vol-panel-head">
            <div>
              <p className="pdp-vol-panel-title">Volume pricing</p>
              <p className="pdp-vol-panel-sub">
                Tap a tier to fill Qty with its minimum, or type any quantity — tier matches when Qty loses focus.
              </p>
            </div>
            <Link href={volumePricingHref} className="pdp-vol-panel-link">
              Calculator
            </Link>
          </div>

          <div className="pdp-vol-tier-list" role="list" data-tier-count={bulkTiers.length}>
            {bulkTiers.map((tier) => {
              const isSelected = matchedBulkTier?.label === tier.label;
              return (
                <button
                  key={tier.label}
                  type="button"
                  className={`pdp-vol-tier-row${isSelected ? ' is-selected' : ''}`}
                  onClick={() => applyTier(tier)}
                  aria-pressed={isSelected}
                  role="listitem"
                >
                  <span className="pdp-vol-tier-marker" aria-hidden="true">
                    {isSelected ? (
                      <svg viewBox="0 0 16 16" className="pdp-vol-tier-check">
                        <path d="M3.5 8.2 6.4 11 12.5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                  <span className="pdp-vol-tier-main">
                    <span className="pdp-vol-tier-range">{tier.rangeLabel} pcs</span>
                    <span className="pdp-vol-tier-min">from {tier.minQuantity} pcs</span>
                  </span>
                  <span className="pdp-vol-tier-price">{tier.unitPriceLabel}</span>
                  <span className={`pdp-vol-tier-save${tier.savingsPercent > 0 ? '' : ' is-muted'}`}>
                    {tier.savingsPercent > 0 ? `-${tier.savingsPercent}%` : 'List'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`pdp-vol-selection is-visible${isVolumeTierActive ? '' : ' is-retail'}`} aria-live="polite">
            <span className="pdp-vol-selection-dot" aria-hidden="true" />
            <span>
              <strong>Qty {previewQuantity}</strong>
              <span className="pdp-vol-selection-sep">·</span>
              {isVolumeTierActive ? (
                <>
                  {previewTier.rangeLabel} pcs tier
                  <span className="pdp-vol-selection-sep">·</span>
                  {previewTier.unitPriceLabel} each
                </>
              ) : (
                <>List price · {retailTier.unitPriceLabel} each</>
              )}
            </span>
          </div>

          {nextTier ? (
            <p className="pdp-vol-upsell">
              Add <strong>{nextTier.unitsToGo}</strong> more to unlock <strong>{nextTier.unitPriceLabel}</strong> each ({nextTier.rangeLabel} pcs)
            </p>
          ) : null}
        </div>
      ) : (
        <p className="pdp-price-list-only">{priceHeadline}</p>
      )}
    </div>
  );
}

export function PdpPurchaseActions() {
  const {
    moq,
    inStock,
    quantity,
    qtyInput,
    updateQuantity,
    beginQtyEdit,
    changeQtyInput,
    commitQtyInput,
    previewTier,
    isVolumeTierActive,
    isPending,
    message,
    handleAddToCart,
    handleBuyNow,
  } = usePdpBuy();
  const { t } = useTranslation();

  if (!inStock) {
    return (
      <div className="pdp-out-of-stock-card" role="status">
        <span className="pdp-stock-status is-unavailable">Out of stock</span>
        <p className="section-description compact-copy">
          This item is not available for immediate purchase. Use Add to Quote or contact engineering for lead-time and restock options.
        </p>
      </div>
    );
  }

  return (
    <div className="product-action-stack pdp-action-cluster pdp-buy-actions">
      {isVolumeTierActive ? (
        <div className="pdp-qty-tier-banner" aria-live="polite">
          <span className="pdp-qty-tier-banner-label">Volume tier applied</span>
          <span className="pdp-qty-tier-banner-value">
            {previewTier.rangeLabel} pcs · {previewTier.unitPriceLabel}/ea
          </span>
        </div>
      ) : null}

      <div className="quantity-cart-row">
        <label className={`quantity-control${isVolumeTierActive ? ' is-tier-linked' : ''}`}>
          <span className="summary-label">Qty</span>
          <div className="quantity-stepper">
            <button
              type="button"
              className="quantity-stepper-button"
              onClick={() => updateQuantity(quantity - 1)}
              disabled={isPending || quantity <= moq}
            >
              -
            </button>
            <input
              type="number"
              min={moq}
              inputMode="numeric"
              className="quantity-stepper-input"
              value={qtyInput}
              onFocus={beginQtyEdit}
              onChange={(event) => changeQtyInput(event.target.value)}
              onBlur={commitQtyInput}
              aria-label="Quantity"
              disabled={isPending}
            />
            <button type="button" className="quantity-stepper-button" onClick={() => updateQuantity(quantity + 1)} disabled={isPending}>
              +
            </button>
          </div>
        </label>

        <button type="button" className="button-primary quantity-cart-button" onClick={handleAddToCart} disabled={isPending}>
          {isPending ? t('common.loading') : t('product.addToCart')}
        </button>
      </div>

      <button type="button" className="button-secondary buy-now-button" onClick={handleBuyNow} disabled={isPending}>
        {isPending ? t('common.loading') : t('product.buyNow')}
      </button>

      {message ? <span className="section-description">{message}</span> : null}
    </div>
  );
}
