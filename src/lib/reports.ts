import type { Transaction } from '@/types';

export interface TrendPoint {
  key: string; // YYYY-MM (monthly) or YYYY (yearly)
  monthIndex: number;
  year: number;
  income: number;
  expense: number;
  net: number;
  current: boolean;
}

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export function monthlyTrend(
  txns: Transaction[],
  months = 6,
  ref = new Date(),
): TrendPoint[] {
  const series: TrendPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    series.push({
      key: monthKey(d),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      income: 0,
      expense: 0,
      net: 0,
      current: i === 0,
    });
  }
  const byKey = new Map(series.map((p) => [p.key, p]));
  for (const txn of txns) {
    const bucket = byKey.get(monthKey(new Date(txn.occurred_at)));
    if (!bucket) continue;
    if (txn.type === 'income') bucket.income += txn.amount;
    else bucket.expense += txn.amount;
  }
  for (const p of series) p.net = p.income - p.expense;
  return series;
}

export function yearlyTrend(
  txns: Transaction[],
  years = 3,
  ref = new Date(),
): TrendPoint[] {
  const series: TrendPoint[] = [];
  for (let i = years - 1; i >= 0; i--) {
    const year = ref.getFullYear() - i;
    series.push({
      key: String(year),
      monthIndex: 0,
      year,
      income: 0,
      expense: 0,
      net: 0,
      current: i === 0,
    });
  }
  const byKey = new Map(series.map((p) => [p.key, p]));
  for (const txn of txns) {
    const bucket = byKey.get(String(new Date(txn.occurred_at).getFullYear()));
    if (!bucket) continue;
    if (txn.type === 'income') bucket.income += txn.amount;
    else bucket.expense += txn.amount;
  }
  for (const p of series) p.net = p.income - p.expense;
  return series;
}

export interface HeatmapMonth {
  key: string; // YYYY-MM
  monthIndex: number;
  year: number;
}

export interface Heatmap {
  months: HeatmapMonth[];
  categories: string[]; // sorted by total desc
  cells: Map<string, number>; // key = `${monthKey}|${category}`
  max: number;
}

export function categoryHeatmap(
  txns: Transaction[],
  months = 6,
  ref = new Date(),
): Heatmap {
  const monthList: HeatmapMonth[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    monthList.push({
      key: monthKey(d),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  const monthKeys = new Set(monthList.map((m) => m.key));

  const cells = new Map<string, number>();
  const categoryTotals = new Map<string, number>();
  let max = 0;
  for (const txn of txns) {
    if (txn.type !== 'expense') continue;
    const key = monthKey(new Date(txn.occurred_at));
    if (!monthKeys.has(key)) continue;
    const cellKey = `${key}|${txn.category}`;
    const total = (cells.get(cellKey) ?? 0) + txn.amount;
    cells.set(cellKey, total);
    if (total > max) max = total;
    categoryTotals.set(
      txn.category,
      (categoryTotals.get(txn.category) ?? 0) + txn.amount,
    );
  }

  const categories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  return { months: monthList, categories, cells, max };
}
