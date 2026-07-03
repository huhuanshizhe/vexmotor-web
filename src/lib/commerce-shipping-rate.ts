import type { ShippingCountryRateConfig } from '@/lib/commerce-config';

function normalizeCountryCode(countryCode: string) {
  return countryCode.trim().toUpperCase();
}

function rateMatchesExactCountry(rate: ShippingCountryRateConfig, normalizedCountryCode: string) {
  if (!rate.enabled) {
    return false;
  }

  if (rate.countryIsoCode && normalizeCountryCode(rate.countryIsoCode) === normalizedCountryCode) {
    return true;
  }

  return normalizeCountryCode(rate.countryCode) === normalizedCountryCode;
}

function rateMatchesContinent(rate: ShippingCountryRateConfig, continentCode: string) {
  if (!rate.enabled || rate.countryIsoCode) {
    return false;
  }

  return rate.regionCode === continentCode || normalizeCountryCode(rate.countryCode) === continentCode;
}

export function resolveShippingRatesForCountry(
  rates: ShippingCountryRateConfig[],
  countryCode: string,
  countryContinentByIso: Record<string, string>,
): ShippingCountryRateConfig[] {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  if (!normalizedCountryCode) {
    return [];
  }

  const exactRates = rates.filter((rate) => rateMatchesExactCountry(rate, normalizedCountryCode));
  if (exactRates.length) {
    return exactRates;
  }

  const continentCode = countryContinentByIso[normalizedCountryCode];
  if (continentCode) {
    const regionRates = rates.filter((rate) => rateMatchesContinent(rate, continentCode));
    if (regionRates.length) {
      return regionRates;
    }
  }

  return rates.filter(
    (rate) => rate.enabled && (rate.regionCode === 'OTHER' || normalizeCountryCode(rate.countryCode) === 'OTHER'),
  );
}
