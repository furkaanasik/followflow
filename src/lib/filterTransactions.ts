import type { CurrencyCode } from '@/lib/currency';
import type { Transaction } from '@/types';

export interface TransactionFilters {
  query: string;
  type: 'all' | 'income' | 'expense';
  categoryKeys: string[]; // empty = all categories
  currencies: CurrencyCode[]; // empty = all currencies
  from: string | null; // ISO date (inclusive, start of day)
  to: string | null; // ISO date (inclusive, end of day)
  minAmount: number | null;
  maxAmount: number | null;
}

export const EMPTY_FILTERS: TransactionFilters = {
  query: '',
  type: 'all',
  categoryKeys: [],
  currencies: [],
  from: null,
  to: null,
  minAmount: null,
  maxAmount: null,
};

// occurred_at is a full ISO timestamp, so the `to` bound is normalized to
// end-of-day — an exact-day range must still include that day's transactions.
export function filterTransactions(
  txns: Transaction[],
  filters: TransactionFilters,
  categoryLabel: (txn: Transaction) => string,
): Transaction[] {
  const q = filters.query.trim().toLowerCase();
  const fromMs = filters.from
    ? new Date(filters.from).setHours(0, 0, 0, 0)
    : null;
  const toMs = filters.to
    ? new Date(filters.to).setHours(23, 59, 59, 999)
    : null;
  return txns.filter((txn) => {
    if (filters.type !== 'all' && txn.type !== filters.type) return false;
    if (
      filters.categoryKeys.length &&
      !filters.categoryKeys.includes(txn.category)
    )
      return false;
    if (
      filters.currencies.length &&
      !filters.currencies.includes(txn.currency as CurrencyCode)
    )
      return false;
    const t = new Date(txn.occurred_at).getTime();
    if (fromMs !== null && t < fromMs) return false;
    if (toMs !== null && t > toMs) return false;
    if (filters.minAmount !== null && txn.amount < filters.minAmount)
      return false;
    if (filters.maxAmount !== null && txn.amount > filters.maxAmount)
      return false;
    if (q) {
      const haystack = [txn.title, categoryLabel(txn), txn.note ?? '']
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// Counts only the advanced (panel) filters — query and type have their own
// always-visible controls, so they never contribute to the badge.
export function activeFilterCount(f: TransactionFilters): number {
  let n = 0;
  if (f.categoryKeys.length) n += 1;
  if (f.currencies.length) n += 1;
  if (f.from || f.to) n += 1;
  if (f.minAmount !== null || f.maxAmount !== null) n += 1;
  return n;
}
