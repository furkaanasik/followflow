const DEFAULT_LOCALE = 'tr-TR';
const CURRENCY = 'TRY';

export function formatCurrency(
  value: number,
  options: { locale?: string; maximumFractionDigits?: number } = {},
): string {
  const { locale = DEFAULT_LOCALE, maximumFractionDigits = 2 } = options;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
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
