export type ExchangeRateSnapshot = {
  baseCurrencyCode: string;
  ratesByCurrency: Record<string, number>;
};

function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase();
}

export function ceilToMoneyDecimals(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.ceil(value * factor) / factor;
}

function getRateToBase(currency: string, snapshot: ExchangeRateSnapshot): number | null {
  const code = normalizeCurrencyCode(currency);
  if (code === snapshot.baseCurrencyCode) return 1;
  const rate = snapshot.ratesByCurrency[code];
  return rate && rate > 0 ? rate : null;
}

export function convertViaBase(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  snapshot: ExchangeRateSnapshot,
): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const from = normalizeCurrencyCode(fromCurrency);
  const to = normalizeCurrencyCode(toCurrency);
  if (from === to) return ceilToMoneyDecimals(amount);

  const fromRate = getRateToBase(from, snapshot);
  const toRate = getRateToBase(to, snapshot);
  if (fromRate == null || toRate == null) return null;

  return ceilToMoneyDecimals(amount * (fromRate / toRate));
}
