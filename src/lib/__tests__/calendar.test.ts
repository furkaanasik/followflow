import {
  buildMonthMatrix,
  calendarMonth,
  eventsForDay,
  expandRecurring,
  payDayEvents,
} from '@/lib/calendar';
import { incomeSource, recurringPayment, txn } from '@/test/fixtures';

const REF = new Date(2026, 6, 15); // 2026-07-15 local

describe('buildMonthMatrix', () => {
  it('returns 42 cells', () => {
    expect(buildMonthMatrix(2026, 6, REF)).toHaveLength(42);
  });

  it('is Monday-first: July 2026 starts on Wednesday, first cell is Mon Jun 29', () => {
    const days = buildMonthMatrix(2026, 6, REF);
    expect(days[0].date).toBe('2026-06-29');
    expect(days[0].inMonth).toBe(false);
    expect(days[2].date).toBe('2026-07-01');
    expect(days[2].inMonth).toBe(true);
  });

  it('marks today', () => {
    const days = buildMonthMatrix(2026, 6, REF);
    const today = days.find((d) => d.isToday);
    expect(today?.date).toBe('2026-07-15');
  });
});

describe('expandRecurring', () => {
  it('marks monthly payment this month even when next_payment_date is a later month', () => {
    const events = expandRecurring(
      [
        recurringPayment({
          frequency: 'monthly',
          next_payment_date: '2026-08-15',
        }),
      ],
      2026,
      6,
    );
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-07-15');
    expect(events[0].sign).toBe(-1);
  });

  it('expands weekly recurrence to every in-month occurrence', () => {
    const events = expandRecurring(
      [
        recurringPayment({
          frequency: 'weekly',
          next_payment_date: '2026-07-03',
        }),
      ],
      2026,
      6,
    );
    expect(events.map((e) => e.date)).toEqual([
      '2026-07-03',
      '2026-07-10',
      '2026-07-17',
      '2026-07-24',
      '2026-07-31',
    ]);
  });

  it('clamps monthly day 31 in a 30-day month', () => {
    const events = expandRecurring(
      [
        recurringPayment({
          frequency: 'monthly',
          next_payment_date: '2026-07-31',
        }),
      ],
      2026,
      8, // September
    );
    expect(events[0].date).toBe('2026-09-30');
  });

  it('one-time payment appears only in its own month', () => {
    const payment = recurringPayment({
      frequency: 'one-time',
      next_payment_date: '2026-07-20',
    });
    expect(expandRecurring([payment], 2026, 6)).toHaveLength(1);
    expect(expandRecurring([payment], 2026, 7)).toHaveLength(0);
  });
});

describe('payDayEvents', () => {
  it('marks pay_day for monthly income', () => {
    const events = payDayEvents(
      [incomeSource({ pay_day: 25, frequency: 'monthly' })],
      2026,
      6,
    );
    expect(events).toHaveLength(1);
    expect(events[0].date).toBe('2026-07-25');
    expect(events[0].sign).toBe(1);
  });

  it('skips one-time income', () => {
    const events = payDayEvents(
      [incomeSource({ pay_day: 25, frequency: 'one-time' })],
      2026,
      6,
    );
    expect(events).toHaveLength(0);
  });

  it('skips sources without pay_day', () => {
    expect(
      payDayEvents([incomeSource({ pay_day: null })], 2026, 6),
    ).toHaveLength(0);
  });

  it('clamps pay_day 31 in February (leap year)', () => {
    const events = payDayEvents([incomeSource({ pay_day: 31 })], 2028, 1);
    expect(events[0].date).toBe('2028-02-29');
  });
});

describe('calendarMonth', () => {
  it('accumulates per-day net from transactions', () => {
    const { days } = calendarMonth({
      recurring: [],
      income: [],
      txns: [
        txn({
          type: 'income',
          amount: 100,
          occurred_at: '2026-07-10T12:00:00',
        }),
        txn({
          type: 'expense',
          amount: 40,
          occurred_at: '2026-07-10T12:00:00',
        }),
      ],
      year: 2026,
      month: 6,
      ref: REF,
    });
    const day = days.find((d) => d.date === '2026-07-10');
    expect(day?.net).toBe(60);
    expect(day?.markers).toEqual(expect.arrayContaining(['income', 'expense']));
  });

  it('attaches payment and payday markers', () => {
    const { days } = calendarMonth({
      recurring: [
        recurringPayment({
          frequency: 'monthly',
          next_payment_date: '2026-07-20',
        }),
      ],
      income: [incomeSource({ pay_day: 25 })],
      txns: [],
      year: 2026,
      month: 6,
      ref: REF,
    });
    expect(days.find((d) => d.date === '2026-07-20')?.markers).toContain(
      'payment',
    );
    expect(days.find((d) => d.date === '2026-07-25')?.markers).toContain(
      'payday',
    );
  });

  it('renders empty data without events', () => {
    const { days, events } = calendarMonth({
      recurring: [],
      income: [],
      txns: [],
      year: 2026,
      month: 6,
      ref: REF,
    });
    expect(days).toHaveLength(42);
    expect(events).toHaveLength(0);
  });
});

describe('eventsForDay', () => {
  it('returns all events on the given date', () => {
    const { events } = calendarMonth({
      recurring: [
        recurringPayment({
          frequency: 'monthly',
          next_payment_date: '2026-07-20',
        }),
      ],
      income: [],
      txns: [txn({ amount: 50, occurred_at: '2026-07-20T12:00:00' })],
      year: 2026,
      month: 6,
      ref: REF,
    });
    expect(eventsForDay(events, '2026-07-20')).toHaveLength(2);
    expect(eventsForDay(events, '2026-07-21')).toHaveLength(0);
  });
});
