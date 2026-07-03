'use client';

import { useMemo } from 'react';

import {
  buildCommercePricingContext,
  calculateOrderPricing,
  type CommerceConfig,
} from '@/lib/commerce-config';
import type { CartDetail } from '@/lib/storefront-types';

export type CheckoutPricingInput = {
  cart: CartDetail | null;
  commerceConfig: CommerceConfig;
  shippingCountryCode: string | null;
  shippingMethodCode: string;
  locale?: string;
};

export type CheckoutPricingResult = {
  isShippingAddressReady: boolean;
  availableShippingOptions: ReturnType<typeof calculateOrderPricing>['availableShippingOptions'];
  selectedShippingOption: ReturnType<typeof calculateOrderPricing>['selectedShippingOption'] | null;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  taxRate: number;
  taxableSubtotal: number;
  freeShippingThreshold: number | null;
  remainingForFreeShipping: number;
};

export function useCheckoutPricing({
  cart,
  commerceConfig,
  shippingCountryCode,
  shippingMethodCode,
}: CheckoutPricingInput): CheckoutPricingResult {
  return useMemo(() => {
    const subtotal = cart?.subtotal.amount ?? 0;
    const discountAmount = cart?.discount.amount ?? 0;
    const isShippingAddressReady = Boolean(shippingCountryCode?.trim());
    const targetCurrency = cart?.subtotal.currency ?? commerceConfig.currencyCode;
    const pricingContext = buildCommercePricingContext(commerceConfig, targetCurrency);

    if (!cart || !isShippingAddressReady) {
      const taxableSubtotal = Math.max(subtotal - discountAmount, 0);
      return {
        isShippingAddressReady,
        availableShippingOptions: [],
        selectedShippingOption: null,
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: taxableSubtotal,
        taxRate: 0,
        taxableSubtotal,
        freeShippingThreshold: null,
        remainingForFreeShipping: 0,
      };
    }

    const pricing = calculateOrderPricing(commerceConfig, {
      subtotal,
      discountAmount,
      countryCode: shippingCountryCode!,
      shippingMethodCode,
      pricingContext,
    });

    return {
      isShippingAddressReady,
      availableShippingOptions: pricing.availableShippingOptions,
      selectedShippingOption: pricing.selectedShippingOption,
      shippingAmount: pricing.shippingAmount,
      taxAmount: pricing.taxAmount,
      totalAmount: pricing.totalAmount,
      taxRate: pricing.taxRate,
      taxableSubtotal: pricing.taxableSubtotal,
      freeShippingThreshold: pricing.freeShippingThreshold,
      remainingForFreeShipping: pricing.remainingForFreeShipping,
    };
  }, [cart, commerceConfig, shippingCountryCode, shippingMethodCode]);
}
