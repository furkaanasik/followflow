import { isGold, toCurrencyCode, type CurrencyCode } from './currency';

const DEFAULT_LOCALE = 'tr-TR';

export function formatCurrency(
  value: number,
  currencyInput: CurrencyCode | string = 'TRY',
  options: { locale?: string; maximumFractionDigits?: number } = {},
): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 2 } = options;
  // DB rows carry currency as plain text; validate here so an unexpected
  // value falls back to TRY instead of throwing inside Intl.NumberFormat.
  const currency = toCurrencyCode(currencyInput);
  // GAU is not an ISO 4217 code — Intl's currency style would throw.
  if (isGold(currency)) {
    return `${formatNumber(value, { locale, maximumFractionDigits })} gr`;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

export function formatNumber(
  value: number,
  options: { locale?: string; maximumFractionDigits?: number } = {},
): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 2 } = options;
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export function formatDate(
  value: Date | string | number,
  options: Intl.DateTimeFormatOptions & { locale?: string } = {},
): string {
  const { locale = DEFAULT_LOCALE, ...rest } = options;
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...rest,
  }).format(date);
}

// Inverse of the amount inputs: accepts TR ("1.234,56") or plain ("1234.56").
// Preserves the existing screens' comma→dot behavior; strips ₺ and spaces.
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[^\d.,-]/g, '');
  if (!cleaned) return NaN; // Number('') is 0 — empty input must read as invalid
  const normalized =
    cleaned.includes(',') && cleaned.includes('.')
      ? cleaned.replace(/\./g, '').replace(',', '.') // dot = grouping
      : cleaned.replace(',', '.');
  return Number(normalized);
}
