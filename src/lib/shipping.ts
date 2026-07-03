import {
  getShippingOptions,
  type CommerceConfig,
  type CommercePricingContext,
  type StorefrontShippingOption,
} from '@/lib/commerce-config';

export type ShippingOption = StorefrontShippingOption;

export function buildShippingOptions(
  countryCode: string,
  subtotal: number,
  config: CommerceConfig,
  pricingContext: CommercePricingContext,
) {
  return getShippingOptions(config, countryCode, subtotal, pricingContext);
}
