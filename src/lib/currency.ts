export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GAU';

export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  'TRY',
  'USD',
  'EUR',
  'GAU',
];

// DB currency columns are plain text (constrained server-side); validate at
// the boundary instead of casting so an unexpected value can never reach
// Intl.NumberFormat or silently vanish from conversions.
export function toCurrencyCode(value: string | null | undefined): CurrencyCode {
  return SUPPORTED_CURRENCIES.includes(value as CurrencyCode)
    ? (value as CurrencyCode)
    : 'TRY';
}

// GAU = gram gold; not an ISO 4217 code, so it never goes through
// Intl currency formatting and its rate derives from the XAU ounce price.
export const isGold = (c: CurrencyCode): boolean => c === 'GAU';

export const GRAMS_PER_TROY_OUNCE = 31.1034768;

// RATE DIRECTION (single source of truth): rates.rates[c] is the value of
// 1 unit of `c` expressed in TRY. TRY itself is always 1. Example:
// { USD: 41.2 } means 1 USD = 41.2 TRY.
export interface RatesTable {
  base: 'TRY';
  rates: Partial<Record<CurrencyCode, number>>;
  asOf: string; // ISO date of the snapshot
}

export function rateInTry(
  currency: CurrencyCode,
  rates: RatesTable,
): number | null {
  if (currency === 'TRY') return 1;
  const rate = rates.rates[currency];
  return rate != null && rate > 0 ? rate : null;
}

// Converts via the TRY pivot. Returns null when a needed rate is missing
// (e.g. no gold rate) — callers decide the fallback, never NaN.
export function convert(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: RatesTable,
): number | null {
  if (from === to) return amount;
  const fromRate = rateInTry(from, rates);
  const toRate = rateInTry(to, rates);
  if (fromRate == null || toRate == null) return null;
  return (amount * fromRate) / toRate;
}

const SYMBOLS: Record<CurrencyCode, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GAU: 'gr',
};

export function symbolFor(c: CurrencyCode): string {
  return SYMBOLS[c];
}
