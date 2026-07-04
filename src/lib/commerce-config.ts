import { convertViaBase, type ExchangeRateSnapshot } from '@/lib/currency-exchange';
import { resolveShippingRatesForCountry } from '@/lib/commerce-shipping-rate';

export type VolumePricingRuleConfig = {
  id: string;
  label: string;
  minQuantity: number;
  priceFactor: number;
  note: string | null;
  enabled: boolean;
};

export type ShippingMethodConfig = {
  id: string;
  code: string;
  name: string;
  etaLabel: string;
  note: string;
  enabled: boolean;
  sortOrder: number;
};

export type ShippingCountryRateConfig = {
  id: string;
  regionCode: string;
  countryIsoCode: string | null;
  regionName?: string | null;
  countryCode: string;
  countryName: string | null;
  shippingMethodCode: string;
  currencyCode: string;
  rate: number;
  freeShippingThreshold: number | null;
  taxRate: number;
  enabled: boolean;
  note: string | null;
};

export type CommerceConfig = {
  defaultShippingMethodCode: string;
  volumePricingRules: VolumePricingRuleConfig[];
  shippingMethods: ShippingMethodConfig[];
  shippingCountryRates: ShippingCountryRateConfig[];
  exchangeRateSnapshot: ExchangeRateSnapshot;
  countryContinentByIso: Record<string, string>;
  /** @deprecated Use getSiteSettings() */
  currencyCode: string;
  /** @deprecated Use getSiteSettings() */
  defaultCountryCode: string;
};

export type CommercePricingContext = {
  targetCurrency: string;
  exchangeSnapshot: ExchangeRateSnapshot;
  countryContinentByIso: Record<string, string>;
};

export type VolumePricingTier = {
  label: string;
  minQuantity: number;
  maxQuantity: number | null;
  rangeLabel: string;
  priceFactor: number;
  unitPriceAmount: number;
  unitPriceLabel: string;
  savingsPercent: number;
  note: string | null;
};

export type StorefrontShippingOption = {
  id: string;
  methodCode: string;
  carrier: string;
  title: string;
  eta: string;
  note: string;
  price: number;
  baseRate: number;
  countryCode: string;
  countryName: string;
  freeShippingThreshold: number | null;
  taxRate: number;
};

function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function roundMoney(amount: number) {
  return Number(amount.toFixed(2));
}

function sortVolumePricingRules(rules: VolumePricingRuleConfig[]) {
  return [...rules].sort((left, right) => left.minQuantity - right.minQuantity || left.label.localeCompare(right.label));
}

function sortShippingMethods(methods: ShippingMethodConfig[]) {
  return [...methods].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
}

export function normalizeCommerceCountryCode(countryCode: string, fallback = '') {
  const normalized = countryCode.trim().toUpperCase();
  return normalized || fallback;
}

function resolveShippingCountryLabel(rate: ShippingCountryRateConfig) {
  const countryName = rate.countryName?.trim();
  if (countryName) {
    return countryName;
  }

  const regionName = rate.regionName?.trim();
  if (regionName) {
    return regionName;
  }

  const isoCode = rate.countryIsoCode?.trim();
  if (isoCode) {
    return isoCode;
  }

  const legacyCode = normalizeCommerceCountryCode(rate.countryCode);
  return legacyCode === 'OTHER' ? 'Other' : legacyCode || 'Other';
}

export function cloneCommerceConfig(config: CommerceConfig): CommerceConfig {
  return {
    currencyCode: config.currencyCode,
    defaultCountryCode: config.defaultCountryCode,
    defaultShippingMethodCode: config.defaultShippingMethodCode,
    exchangeRateSnapshot: {
      baseCurrencyCode: config.exchangeRateSnapshot.baseCurrencyCode,
      ratesByCurrency: { ...config.exchangeRateSnapshot.ratesByCurrency },
    },
    countryContinentByIso: { ...config.countryContinentByIso },
    volumePricingRules: config.volumePricingRules.map((rule) => ({ ...rule })),
    shippingMethods: config.shippingMethods.map((method) => ({ ...method })),
    shippingCountryRates: config.shippingCountryRates.map((rate) => ({ ...rate })),
  };
}

export function buildVolumePricingTiers(
  basePrice: number,
  currency: string,
  rules: VolumePricingRuleConfig[],
): VolumePricingTier[] {
  const sourceRules = sortVolumePricingRules(rules.filter((rule) => rule.enabled));
  if (!sourceRules.length) {
    return [];
  }

  return sourceRules.map((tier, index) => {
    const nextTier = sourceRules[index + 1];
    const unitPriceAmount = roundMoney(basePrice * tier.priceFactor);

    return {
      label: tier.label,
      minQuantity: tier.minQuantity,
      maxQuantity: nextTier ? nextTier.minQuantity - 1 : null,
      rangeLabel: nextTier ? `${tier.minQuantity}-${nextTier.minQuantity - 1}` : `${tier.minQuantity}+`,
      priceFactor: tier.priceFactor,
      unitPriceAmount,
      unitPriceLabel: formatMoney(unitPriceAmount, currency),
      savingsPercent: Math.round((1 - tier.priceFactor) * 100),
      note: tier.note,
    };
  });
}

export function getVolumePricingForQuantity(
  basePrice: number,
  currency: string,
  quantity: number,
  rules: VolumePricingRuleConfig[],
) {
  const tiers = buildVolumePricingTiers(basePrice, currency, rules);
  const normalizedQuantity = Math.max(1, quantity);

  if (!tiers.length) {
    return getRetailVolumeTier(basePrice, currency, rules);
  }

  return tiers.reduce((current, tier) => (normalizedQuantity >= tier.minQuantity ? tier : current), tiers[0]!);
}

export function getRetailVolumeTier(
  basePrice: number,
  currency: string,
  rules: VolumePricingRuleConfig[],
): VolumePricingTier {
  const tiers = buildVolumePricingTiers(basePrice, currency, rules);
  const listTier = tiers.find((tier) => tier.minQuantity === 1);

  if (listTier) {
    return listTier;
  }

  const firstBulkMin = tiers.find((tier) => tier.minQuantity > 1)?.minQuantity;
  const unitPriceAmount = roundMoney(basePrice);

  return {
    label: 'List',
    minQuantity: 1,
    maxQuantity: firstBulkMin ? firstBulkMin - 1 : null,
    rangeLabel: firstBulkMin ? `1-${firstBulkMin - 1}` : '1',
    priceFactor: 1,
    unitPriceAmount,
    unitPriceLabel: formatMoney(unitPriceAmount, currency),
    savingsPercent: 0,
    note: null,
  };
}

export function getBulkVolumeTierForQuantity(
  basePrice: number,
  currency: string,
  quantity: number,
  rules: VolumePricingRuleConfig[],
): VolumePricingTier | null {
  const tiers = buildVolumePricingTiers(basePrice, currency, rules);
  const bulkTiers = tiers.filter((tier) => tier.minQuantity > 1);

  if (!bulkTiers.length) {
    return null;
  }

  const normalizedQuantity = Math.max(1, quantity);
  const firstBulkMin = bulkTiers[0]!.minQuantity;

  if (normalizedQuantity < firstBulkMin) {
    return null;
  }

  return bulkTiers.reduce(
    (current, tier) => (normalizedQuantity >= tier.minQuantity ? tier : current),
    bulkTiers[0]!,
  );
}

export function getNextVolumeTier(
  basePrice: number,
  currency: string,
  quantity: number,
  rules: VolumePricingRuleConfig[],
) {
  const tiers = buildVolumePricingTiers(basePrice, currency, rules);
  const normalizedQuantity = Math.max(1, quantity);
  const nextTier = tiers.find((tier) => tier.minQuantity > normalizedQuantity);

  if (!nextTier) {
    return null;
  }

  return {
    ...nextTier,
    unitsToGo: nextTier.minQuantity - normalizedQuantity,
  };
}

export function getVolumePricingEstimate(
  basePrice: number,
  currency: string,
  quantity: number,
  rules: VolumePricingRuleConfig[],
) {
  const normalizedQuantity = Math.max(1, quantity);
  const applicableTier = getVolumePricingForQuantity(basePrice, currency, normalizedQuantity, rules);
  const listExtendedAmount = roundMoney(basePrice * normalizedQuantity);
  const tierExtendedAmount = roundMoney(applicableTier.unitPriceAmount * normalizedQuantity);
  const savingsAmount = roundMoney(listExtendedAmount - tierExtendedAmount);

  return {
    quantity: normalizedQuantity,
    applicableTier,
    listExtendedAmount,
    listExtendedLabel: formatMoney(listExtendedAmount, currency),
    tierExtendedAmount,
    tierExtendedLabel: formatMoney(tierExtendedAmount, currency),
    savingsAmount,
    savingsLabel: formatMoney(savingsAmount, currency),
    savingsPercent: listExtendedAmount > 0 ? Math.round((savingsAmount / listExtendedAmount) * 100) : 0,
  };
}

function convertShippingMoney(
  amount: number | null,
  fromCurrency: string,
  pricingContext: CommercePricingContext,
) {
  if (amount == null) {
    return null;
  }

  const from = fromCurrency.trim().toUpperCase();
  const to = pricingContext.targetCurrency.trim().toUpperCase();
  if (from === to) {
    return roundMoney(amount);
  }

  const converted = convertViaBase(amount, from, to, pricingContext.exchangeSnapshot);
  if (converted == null) {
    return roundMoney(amount);
  }

  return roundMoney(converted);
}

function getRatesForCountry(config: CommerceConfig, countryCode: string, countryContinentByIso: Record<string, string>) {
  return resolveShippingRatesForCountry(config.shippingCountryRates, countryCode, countryContinentByIso);
}

export function getShippingCountryOptions(config: CommerceConfig) {
  const seen = new Set<string>();

  return config.shippingCountryRates
    .filter((rate) => rate.enabled)
    .map((rate) => ({
      code: normalizeCommerceCountryCode(rate.countryCode),
      label: resolveShippingCountryLabel(rate),
    }))
    .filter((country) => {
      if (seen.has(country.code)) {
        return false;
      }

      seen.add(country.code);
      return true;
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function getShippingOptions(
  config: CommerceConfig,
  countryCode: string,
  subtotal: number,
  pricingContext: CommercePricingContext,
) {
  const methodByCode = new Map(sortShippingMethods(config.shippingMethods.filter((method) => method.enabled)).map((method) => [method.code, method]));

  return getRatesForCountry(config, countryCode, pricingContext.countryContinentByIso)
    .map((rate) => {
      const method = methodByCode.get(rate.shippingMethodCode);
      if (!method) {
        return null;
      }

      const rateCurrency = rate.currencyCode.trim().toUpperCase() || 'USD';
      const convertedBaseRate = convertShippingMoney(rate.rate, rateCurrency, pricingContext) ?? roundMoney(rate.rate);
      const convertedFreeShippingThreshold = convertShippingMoney(rate.freeShippingThreshold, rateCurrency, pricingContext);
      const qualifiesForFreeShipping =
        convertedFreeShippingThreshold != null && subtotal >= convertedFreeShippingThreshold;
      const laneNote = method.note.trim() || rate.note || '';
      return {
        id: method.code,
        methodCode: method.code,
        carrier: method.name,
        title: method.name,
        eta: method.etaLabel,
        note: qualifiesForFreeShipping
          ? `Free shipping applied for orders over ${formatMoney(convertedFreeShippingThreshold ?? 0, pricingContext.targetCurrency)} on this lane.`
          : laneNote,
        price: qualifiesForFreeShipping ? 0 : convertedBaseRate,
        baseRate: convertedBaseRate,
        countryCode: normalizeCommerceCountryCode(rate.countryCode),
        countryName: resolveShippingCountryLabel(rate),
        freeShippingThreshold: convertedFreeShippingThreshold,
        taxRate: rate.taxRate,
      } satisfies StorefrontShippingOption;
    })
    .filter((option): option is StorefrontShippingOption => Boolean(option));
}

export function getEstimatedTaxRate(
  config: CommerceConfig,
  countryCode: string,
  countryContinentByIso: Record<string, string>,
) {
  const rate = getRatesForCountry(config, countryCode, countryContinentByIso)[0];
  return rate?.taxRate ?? 0;
}

export function getPrimaryShippingOption(
  config: CommerceConfig,
  countryCode: string,
  subtotal: number,
  pricingContext: CommercePricingContext,
) {
  const options = getShippingOptions(config, countryCode, subtotal, pricingContext);

  return options.find((option) => option.methodCode === config.defaultShippingMethodCode) ?? options[0] ?? null;
}

export function buildCommercePricingContext(
  config: CommerceConfig,
  targetCurrency: string,
): CommercePricingContext {
  return {
    targetCurrency,
    exchangeSnapshot: config.exchangeRateSnapshot,
    countryContinentByIso: config.countryContinentByIso,
  };
}

export function calculateOrderPricing(
  config: CommerceConfig,
  input: {
    subtotal: number;
    discountAmount?: number;
    countryCode: string;
    shippingMethodCode?: string | null;
    pricingContext: CommercePricingContext;
  },
) {
  const normalizedSubtotal = roundMoney(Math.max(0, input.subtotal));
  const normalizedDiscountAmount = roundMoney(Math.max(0, input.discountAmount ?? 0));
  const taxableSubtotal = roundMoney(Math.max(normalizedSubtotal - normalizedDiscountAmount, 0));
  const options = getShippingOptions(config, input.countryCode, normalizedSubtotal, input.pricingContext);
  const selectedShippingOption =
    options.find((option) => option.methodCode === input.shippingMethodCode)
    ?? getPrimaryShippingOption(config, input.countryCode, normalizedSubtotal, input.pricingContext);
  const shippingAmount = roundMoney(selectedShippingOption?.price ?? 0);
  const taxRate = selectedShippingOption?.taxRate ?? getEstimatedTaxRate(config, input.countryCode, input.pricingContext.countryContinentByIso);
  const taxAmount = roundMoney(taxableSubtotal * taxRate);
  const totalAmount = roundMoney(taxableSubtotal + shippingAmount + taxAmount);
  const freeShippingThreshold = selectedShippingOption?.freeShippingThreshold ?? null;
  const remainingForFreeShipping = freeShippingThreshold == null ? 0 : roundMoney(Math.max(freeShippingThreshold - normalizedSubtotal, 0));

  return {
    shippingAmount,
    taxAmount,
    totalAmount,
    taxRate,
    taxableSubtotal,
    freeShippingThreshold,
    remainingForFreeShipping,
    selectedShippingOption,
    availableShippingOptions: options,
  };
}