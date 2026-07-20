import type {
  Budget,
  IncomeSource,
  RecurringPayment,
  Transaction,
} from '@/types';

// budgets.period_month is a Postgres `date` stored as the first of the month
// (YYYY-MM-01) — build the string with `-01`, never bare YYYY-MM.
export const currentPeriodMonth = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

export const isSameMonth = (iso: string, ref = new Date()) => {
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
};

export interface MonthSummary {
  income: number;
  expense: number;
  net: number;
}

export function monthSummary(
  txns: Transaction[],
  ref = new Date(),
): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const txn of txns) {
    if (!isSameMonth(txn.occurred_at, ref)) continue;
    if (txn.type === 'income') income += txn.amount;
    else expense += txn.amount;
  }
  return { income, expense, net: income - expense };
}

export interface CategorySlice {
  category: string;
  total: number;
}

export function expenseByCategory(
  txns: Transaction[],
  ref = new Date(),
): CategorySlice[] {
  const totals = new Map<string, number>();
  for (const txn of txns) {
    if (txn.type !== 'expense' || !isSameMonth(txn.occurred_at, ref)) continue;
    totals.set(txn.category, (totals.get(txn.category) ?? 0) + txn.amount);
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  percent: number; // 0-100, clamped for the bar
  over: boolean;
}

// Join: a transaction counts toward a budget when its category key equals
// budget.category_name (case-insensitive). Seed data may store a display name
// in category_name; matching case-insensitively covers "Market" vs "market".
// Going forward, store the category KEY in both columns.
export function budgetProgress(
  budgets: Budget[],
  txns: Transaction[],
  ref = new Date(),
): BudgetProgress[] {
  return budgets.map((budget) => {
    const target = budget.category_name.toLowerCase();
    let spent = 0;
    for (const txn of txns) {
      if (txn.type !== 'expense' || !isSameMonth(txn.occurred_at, ref))
        continue;
      if (txn.category.toLowerCase() === target) spent += txn.amount;
    }
    const percent =
      budget.limit_amount > 0
        ? Math.min(100, Math.max(0, (spent / budget.limit_amount) * 100))
        : 0;
    return { budget, spent, percent, over: spent > budget.limit_amount };
  });
}

// Normalize any frequency to its monthly equivalent; one-time income is not
// recurring so it contributes nothing.
const MONTHLY_FACTOR: Record<IncomeSource['frequency'], number> = {
  weekly: 4,
  biweekly: 2,
  monthly: 1,
  yearly: 1 / 12,
  'one-time': 0,
};

export function monthlyIncomeTotal(sources: IncomeSource[]): number {
  return sources.reduce(
    (sum, source) => sum + source.amount * MONTHLY_FACTOR[source.frequency],
    0,
  );
}

export interface UpcomingPayment {
  payment: RecurringPayment;
  daysLeft: number;
}

export function nextUpcomingPayment(
  payments: RecurringPayment[],
  ref = new Date(),
): UpcomingPayment | null {
  const today = startOfDay(ref);
  let next: UpcomingPayment | null = null;
  for (const payment of payments) {
    const due = startOfDay(new Date(payment.next_payment_date));
    if (due < today) continue;
    const daysLeft = Math.round((due - today) / 86_400_000);
    if (!next || daysLeft < next.daysLeft) next = { payment, daysLeft };
  }
  return next;
}

export type DateBucket = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function bucketFor(iso: string, ref = new Date()): DateBucket {
  const day = startOfDay(new Date(iso));
  const today = startOfDay(ref);
  const oneDay = 86_400_000;
  if (day === today) return 'today';
  if (day === today - oneDay) return 'yesterday';
  if (day > today - 7 * oneDay) return 'thisWeek';
  return 'earlier';
}

export interface TxnGroup {
  bucket: DateBucket;
  items: Transaction[];
}

const BUCKET_ORDER: DateBucket[] = [
  'today',
  'yesterday',
  'thisWeek',
  'earlier',
];

export function groupByDate(txns: Transaction[], ref = new Date()): TxnGroup[] {
  const buckets = new Map<DateBucket, Transaction[]>();
  const sorted = [...txns].sort(
    (a, b) =>
      new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
  );
  for (const txn of sorted) {
    const bucket = bucketFor(txn.occurred_at, ref);
    const list = buckets.get(bucket);
    if (list) list.push(txn);
    else buckets.set(bucket, [txn]);
  }
  return BUCKET_ORDER.filter((bucket) => buckets.has(bucket)).map((bucket) => ({
    bucket,
    items: buckets.get(bucket)!,
  }));
}
