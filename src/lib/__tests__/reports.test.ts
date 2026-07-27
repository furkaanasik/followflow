import { categoryHeatmap, monthlyTrend, yearlyTrend } from '@/lib/reports';
import { txn } from '@/test/fixtures';

const REF = new Date(2026, 6, 15); // 2026-07-15 local

// local-noon ISO keeps day-precision assertions TZ-agnostic
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00`;

describe('monthlyTrend', () => {
  it('returns one bucket per month, oldest first', () => {
    const series = monthlyTrend([], 6, REF);
    expect(series).toHaveLength(6);
    expect(series[0].key).toBe('2026-02');
    expect(series[5].key).toBe('2026-07');
  });

  it('splits income and expense, computes net', () => {
    const txns = [
      txn({ type: 'income', amount: 100, occurred_at: iso(2026, 7, 5) }),
      txn({ type: 'expense', amount: 40, occurred_at: iso(2026, 7, 10) }),
    ];
    const series = monthlyTrend(txns, 6, REF);
    const last = series[5];
    expect(last).toMatchObject({ income: 100, expense: 40, net: 60 });
  });

  it('flags only the last bucket as current', () => {
    const series = monthlyTrend([], 6, REF);
    expect(series.filter((p) => p.current)).toHaveLength(1);
    expect(series[5].current).toBe(true);
  });

  it('excludes transactions outside the window', () => {
    const txns = [
      txn({ type: 'expense', amount: 999, occurred_at: iso(2025, 11, 5) }),
    ];
    const series = monthlyTrend(txns, 6, REF);
    expect(series.every((p) => p.expense === 0)).toBe(true);
  });

  it('handles year boundary in window', () => {
    const series = monthlyTrend(
      [txn({ type: 'expense', amount: 10, occurred_at: iso(2025, 12, 20) })],
      6,
      new Date(2026, 0, 15),
    );
    expect(series[0].key).toBe('2025-08');
    expect(series[4].key).toBe('2025-12');
    expect(series[4].expense).toBe(10);
  });
});

describe('yearlyTrend', () => {
  it('buckets totals per calendar year', () => {
    const txns = [
      txn({ type: 'income', amount: 100, occurred_at: iso(2024, 3, 1) }),
      txn({ type: 'expense', amount: 30, occurred_at: iso(2025, 6, 1) }),
      txn({ type: 'expense', amount: 20, occurred_at: iso(2026, 1, 1) }),
    ];
    const series = yearlyTrend(txns, 3, REF);
    expect(series.map((p) => p.key)).toEqual(['2024', '2025', '2026']);
    expect(series[0]).toMatchObject({ income: 100, expense: 0, net: 100 });
    expect(series[1]).toMatchObject({ income: 0, expense: 30, net: -30 });
    expect(series[2]).toMatchObject({ income: 0, expense: 20, net: -20 });
    expect(series[2].current).toBe(true);
  });

  it('excludes years outside window', () => {
    const series = yearlyTrend(
      [txn({ type: 'expense', amount: 5, occurred_at: iso(2020, 1, 1) })],
      3,
      REF,
    );
    expect(series.every((p) => p.expense === 0)).toBe(true);
  });
});

describe('categoryHeatmap', () => {
  it('ignores income transactions', () => {
    const heatmap = categoryHeatmap(
      [
        txn({ type: 'income', amount: 500, occurred_at: iso(2026, 7, 1) }),
        txn({
          type: 'expense',
          category: 'market',
          amount: 50,
          occurred_at: iso(2026, 7, 2),
        }),
      ],
      6,
      REF,
    );
    expect(heatmap.categories).toEqual(['market']);
    expect(heatmap.cells.get('2026-07|market')).toBe(50);
  });

  it('max is the largest single cell', () => {
    const heatmap = categoryHeatmap(
      [
        txn({ category: 'market', amount: 30, occurred_at: iso(2026, 7, 1) }),
        txn({ category: 'market', amount: 40, occurred_at: iso(2026, 7, 2) }),
        txn({ category: 'kafe', amount: 60, occurred_at: iso(2026, 6, 1) }),
      ],
      6,
      REF,
    );
    expect(heatmap.max).toBe(70);
    expect(heatmap.cells.get('2026-07|market')).toBe(70);
    expect(heatmap.cells.get('2026-06|kafe')).toBe(60);
  });

  it('sorts categories by total desc across the window', () => {
    const heatmap = categoryHeatmap(
      [
        txn({ category: 'kafe', amount: 10, occurred_at: iso(2026, 5, 1) }),
        txn({ category: 'market', amount: 100, occurred_at: iso(2026, 6, 1) }),
        txn({ category: 'ulasim', amount: 50, occurred_at: iso(2026, 7, 1) }),
      ],
      6,
      REF,
    );
    expect(heatmap.categories).toEqual(['market', 'ulasim', 'kafe']);
  });

  it('excludes expenses outside the window', () => {
    const heatmap = categoryHeatmap(
      [txn({ category: 'market', amount: 99, occurred_at: iso(2025, 11, 1) })],
      6,
      REF,
    );
    expect(heatmap.categories).toEqual([]);
    expect(heatmap.max).toBe(0);
  });

  it('empty input yields empty heatmap with month window intact', () => {
    const heatmap = categoryHeatmap([], 6, REF);
    expect(heatmap.months).toHaveLength(6);
    expect(heatmap.months[0].key).toBe('2026-02');
    expect(heatmap.categories).toEqual([]);
    expect(heatmap.cells.size).toBe(0);
    expect(heatmap.max).toBe(0);
  });
});
