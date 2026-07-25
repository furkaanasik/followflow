import {
  averageMonthlyContribution,
  bucketFor,
  budgetProgress,
  currentPeriodMonth,
  expenseByCategory,
  goalPercent,
  goalProjectionMonths,
  groupByDate,
  isSameMonth,
  monthlyContributionSeries,
  monthlyIncomeTotal,
  monthSummary,
  nextUpcomingPayment,
} from '@/lib/aggregate';
import {
  budget,
  goal,
  goalContribution,
  incomeSource,
  recurringPayment,
  txn,
} from '@/test/fixtures';

const REF = new Date(2026, 6, 15); // 2026-07-15 local

// local-noon ISO keeps day-precision assertions TZ-agnostic
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00`;

describe('currentPeriodMonth', () => {
  it('returns first-of-month date string', () => {
    expect(currentPeriodMonth(new Date(2026, 6, 15))).toBe('2026-07-01');
  });

  it('zero-pads single-digit months', () => {
    expect(currentPeriodMonth(new Date(2026, 0, 5))).toBe('2026-01-01');
  });
});

describe('isSameMonth', () => {
  it('true for same month', () => {
    expect(isSameMonth(iso(2026, 7, 3), REF)).toBe(true);
  });

  it('false for adjacent month', () => {
    expect(isSameMonth(iso(2026, 6, 15), REF)).toBe(false);
    expect(isSameMonth(iso(2026, 8, 15), REF)).toBe(false);
  });

  it('false for same month of different year', () => {
    expect(isSameMonth(iso(2025, 7, 15), REF)).toBe(false);
  });
});

describe('monthSummary', () => {
  it('sums income and expense within ref month', () => {
    const txns = [
      txn({ type: 'income', amount: 100, occurred_at: iso(2026, 7, 5) }),
      txn({ type: 'expense', amount: 40, occurred_at: iso(2026, 7, 10) }),
      txn({ type: 'expense', amount: 999, occurred_at: iso(2026, 6, 10) }),
    ];
    expect(monthSummary(txns, REF)).toEqual({
      income: 100,
      expense: 40,
      net: 60,
    });
  });

  it('empty input yields zeroes', () => {
    expect(monthSummary([], REF)).toEqual({ income: 0, expense: 0, net: 0 });
  });
});

describe('expenseByCategory', () => {
  it('sums per category, sorted desc, excludes income and out-of-month', () => {
    const txns = [
      txn({ category: 'market', amount: 50, occurred_at: iso(2026, 7, 5) }),
      txn({ category: 'market', amount: 30, occurred_at: iso(2026, 7, 6) }),
      txn({ category: 'kafe', amount: 200, occurred_at: iso(2026, 7, 7) }),
      txn({
        type: 'income',
        category: 'maas',
        amount: 5000,
        occurred_at: iso(2026, 7, 1),
      }),
      txn({ category: 'kira', amount: 900, occurred_at: iso(2026, 6, 5) }),
    ];
    expect(expenseByCategory(txns, REF)).toEqual([
      { category: 'kafe', total: 200 },
      { category: 'market', total: 80 },
    ]);
  });

  it('empty input yields empty array', () => {
    expect(expenseByCategory([], REF)).toEqual([]);
  });
});

describe('budgetProgress', () => {
  it('matches category case-insensitively', () => {
    const b = budget({ category_name: 'Market', limit_amount: 100 });
    const txns = [
      txn({ category: 'market', amount: 60, occurred_at: iso(2026, 7, 5) }),
    ];
    const [p] = budgetProgress([b], txns, REF);
    expect(p.spent).toBe(60);
    expect(p.percent).toBe(60);
    expect(p.over).toBe(false);
  });

  it('clamps percent to 100 and flags over', () => {
    const b = budget({ limit_amount: 100 });
    const txns = [
      txn({ category: 'market', amount: 150, occurred_at: iso(2026, 7, 5) }),
    ];
    const [p] = budgetProgress([b], txns, REF);
    expect(p.percent).toBe(100);
    expect(p.over).toBe(true);
  });

  it('limit 0 yields percent 0', () => {
    const b = budget({ limit_amount: 0 });
    const txns = [
      txn({ category: 'market', amount: 10, occurred_at: iso(2026, 7, 5) }),
    ];
    const [p] = budgetProgress([b], txns, REF);
    expect(p.percent).toBe(0);
    expect(p.over).toBe(true);
  });

  it('ignores income and out-of-month txns', () => {
    const b = budget({ limit_amount: 100 });
    const txns = [
      txn({
        type: 'income',
        category: 'market',
        amount: 10,
        occurred_at: iso(2026, 7, 5),
      }),
      txn({ category: 'market', amount: 10, occurred_at: iso(2026, 6, 5) }),
    ];
    expect(budgetProgress([b], txns, REF)[0].spent).toBe(0);
  });
});

describe('monthlyIncomeTotal', () => {
  it('weights each frequency to monthly equivalent', () => {
    const sources = [
      incomeSource({ frequency: 'weekly', amount: 10 }), // 40
      incomeSource({ frequency: 'biweekly', amount: 10 }), // 20
      incomeSource({ frequency: 'monthly', amount: 10 }), // 10
      incomeSource({ frequency: 'yearly', amount: 120 }), // 10
      incomeSource({ frequency: 'one-time', amount: 999 }), // 0
    ];
    expect(monthlyIncomeTotal(sources)).toBe(80);
  });

  it('empty input yields 0', () => {
    expect(monthlyIncomeTotal([])).toBe(0);
  });
});

describe('nextUpcomingPayment', () => {
  it('picks soonest future payment', () => {
    const payments = [
      recurringPayment({ id: 'a', next_payment_date: iso(2026, 7, 25) }),
      recurringPayment({ id: 'b', next_payment_date: iso(2026, 7, 18) }),
    ];
    const next = nextUpcomingPayment(payments, REF);
    expect(next?.payment.id).toBe('b');
    expect(next?.daysLeft).toBe(3);
  });

  it('includes today with daysLeft 0', () => {
    const payments = [
      recurringPayment({ next_payment_date: iso(2026, 7, 15) }),
    ];
    expect(nextUpcomingPayment(payments, REF)?.daysLeft).toBe(0);
  });

  it('skips past payments; all-past or empty yields null', () => {
    const past = [recurringPayment({ next_payment_date: iso(2026, 7, 10) })];
    expect(nextUpcomingPayment(past, REF)).toBeNull();
    expect(nextUpcomingPayment([], REF)).toBeNull();
  });
});

describe('goalPercent', () => {
  it('computes percent of target', () => {
    expect(goalPercent(goal({ target_amount: 200, current_amount: 50 }))).toBe(
      25,
    );
  });

  it('clamps at 100 when current exceeds target', () => {
    expect(goalPercent(goal({ target_amount: 100, current_amount: 150 }))).toBe(
      100,
    );
  });

  it('target 0 yields 0', () => {
    expect(goalPercent(goal({ target_amount: 0, current_amount: 50 }))).toBe(0);
  });
});

describe('monthlyContributionSeries', () => {
  it('builds window of given length ending at ref month', () => {
    const series = monthlyContributionSeries([], 6, REF);
    expect(series).toHaveLength(6);
    expect(series[0].key).toBe('2026-02');
    expect(series[5].key).toBe('2026-07');
    expect(series[5].current).toBe(true);
    expect(series.filter((m) => m.current)).toHaveLength(1);
  });

  it('buckets contributions by month, drops out-of-window', () => {
    const contribs = [
      goalContribution({ amount: 100, occurred_at: iso(2026, 7, 5) }),
      goalContribution({ amount: 50, occurred_at: iso(2026, 7, 20) }),
      goalContribution({ amount: 30, occurred_at: iso(2026, 5, 10) }),
      goalContribution({ amount: 999, occurred_at: iso(2025, 12, 10) }),
    ];
    const series = monthlyContributionSeries(contribs, 6, REF);
    expect(series.find((m) => m.key === '2026-07')?.total).toBe(150);
    expect(series.find((m) => m.key === '2026-05')?.total).toBe(30);
    expect(series.reduce((s, m) => s + m.total, 0)).toBe(180);
  });
});

describe('averageMonthlyContribution', () => {
  it('averages only months with contributions', () => {
    const contribs = [
      goalContribution({ amount: 100, occurred_at: iso(2026, 7, 5) }),
      goalContribution({ amount: 200, occurred_at: iso(2026, 6, 5) }),
    ];
    expect(averageMonthlyContribution(contribs, 6, REF)).toBe(150);
  });

  it('no contributions yields 0', () => {
    expect(averageMonthlyContribution([], 6, REF)).toBe(0);
  });
});

describe('goalProjectionMonths', () => {
  it('ceils remaining over rate', () => {
    expect(goalProjectionMonths(1000, 300)).toBe(4);
  });

  it('rate <= 0 yields null', () => {
    expect(goalProjectionMonths(1000, 0)).toBeNull();
    expect(goalProjectionMonths(1000, -5)).toBeNull();
  });
});

describe('bucketFor', () => {
  it('classifies relative to ref day', () => {
    expect(bucketFor(iso(2026, 7, 15), REF)).toBe('today');
    expect(bucketFor(iso(2026, 7, 14), REF)).toBe('yesterday');
    expect(bucketFor(iso(2026, 7, 9), REF)).toBe('thisWeek'); // 6 days back
    expect(bucketFor(iso(2026, 7, 8), REF)).toBe('earlier'); // 7 days back
    expect(bucketFor(iso(2026, 6, 1), REF)).toBe('earlier');
  });
});

describe('groupByDate', () => {
  it('groups in bucket order, sorts newest-first, omits empty buckets', () => {
    const txns = [
      txn({ id: 'old', occurred_at: iso(2026, 6, 1) }),
      txn({ id: 'today-early', occurred_at: iso(2026, 7, 15) }),
      txn({ id: 'week', occurred_at: iso(2026, 7, 10) }),
    ];
    const groups = groupByDate(txns, REF);
    expect(groups.map((g) => g.bucket)).toEqual([
      'today',
      'thisWeek',
      'earlier',
    ]);
    expect(groups[0].items.map((t) => t.id)).toEqual(['today-early']);
  });

  it('empty input yields empty array', () => {
    expect(groupByDate([], REF)).toEqual([]);
  });
});
