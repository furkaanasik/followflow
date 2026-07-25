import { computeNextPaymentDate } from '@/lib/onboarding';

describe('computeNextPaymentDate', () => {
  it('future day this month stays this month', () => {
    expect(computeNextPaymentDate(20, new Date(2026, 6, 15))).toBe(
      '2026-07-20',
    );
  });

  it('past day rolls to next month', () => {
    expect(computeNextPaymentDate(10, new Date(2026, 6, 15))).toBe(
      '2026-08-10',
    );
  });

  it('same day stays today', () => {
    expect(computeNextPaymentDate(15, new Date(2026, 6, 15))).toBe(
      '2026-07-15',
    );
  });

  it('clamps day 31 in a 30-day month', () => {
    // June has 30 days; today June 15 → candidate June 30
    expect(computeNextPaymentDate(31, new Date(2026, 5, 15))).toBe(
      '2026-06-30',
    );
  });

  it('rollover re-clamps to shorter next month', () => {
    // Jan 31 already past on Jan 31? use today Jan 15 → candidate Jan 31 future, stays.
    // Force rollover: today Feb 20, day 10 past → March 10
    expect(computeNextPaymentDate(10, new Date(2026, 1, 20))).toBe(
      '2026-03-10',
    );
    // today Jan 31 (candidate Jan 31 == today, stays this month)
    expect(computeNextPaymentDate(31, new Date(2026, 0, 31))).toBe(
      '2026-01-31',
    );
    // 2026 Feb has 28 days: today Feb 15, day 31 clamps to Feb 28 (future)
    expect(computeNextPaymentDate(31, new Date(2026, 1, 15))).toBe(
      '2026-02-28',
    );
  });

  it('year boundary rolls December into January', () => {
    expect(computeNextPaymentDate(5, new Date(2026, 11, 20))).toBe(
      '2027-01-05',
    );
  });
});
