import { getMarketDefaults, normalizeLocale, type Locale } from '@/lib/i18n';

function resolveOrderCurrencyFromStored(
  order: { currencyCode?: string | null; locale?: string | null },
  locale: Locale,
) {
  const stored = order.currencyCode?.trim().toUpperCase();
  const orderLocale = normalizeLocale(order.locale ?? locale);
  const marketCurrency = getMarketDefaults(orderLocale).currency;

  if ((!stored || stored === 'USD') && orderLocale !== 'en' && marketCurrency !== 'USD') {
    return marketCurrency;
  }

  return stored || getMarketDefaults(locale).currency;
}

export function resolveOrderDisplayCurrency(
  order: { currencyCode?: string | null; locale?: string | null },
  locale: Locale,
  paymentSessionCurrency?: string | null,
) {
  const resolved = resolveOrderCurrencyFromStored(order, locale);
  const session = paymentSessionCurrency?.trim().toUpperCase();
  if (session && session === resolved) {
    return session;
  }
  return resolved;
}
