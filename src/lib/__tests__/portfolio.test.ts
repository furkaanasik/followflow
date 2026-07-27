import { type RatesTable } from '@/lib/currency';
import {
  holdingsByCurrency,
  totalInMainCurrency,
  type SignedAmount,
} from '@/lib/portfolio';

const rates: RatesTable = {
  base: 'TRY',
  rates: { USD: 40, EUR: 44 },
  asOf: '2026-07-27',
};

const row = (
  amount: number,
  currency: string,
  sign: 1 | -1 = 1,
): SignedAmount => ({ amount, currency, sign });

describe('holdingsByCurrency', () => {
  it('groups signed totals per currency in supported order', () => {
    expect(
      holdingsByCurrency([
        row(100, 'USD'),
        row(500, 'TRY'),
        row(30, 'USD', -1),
        row(5, 'GAU'),
      ]),
    ).toEqual([
      { currency: 'TRY', total: 500 },
      { currency: 'USD', total: 70 },
      { currency: 'GAU', total: 5 },
    ]);
  });

  it('drops zeroed-out units', () => {
    expect(
      holdingsByCurrency([row(10, 'USD'), row(10, 'USD', -1), row(1, 'TRY')]),
    ).toEqual([{ currency: 'TRY', total: 1 }]);
  });

  it('empty input yields TRY 0 anchor', () => {
    expect(holdingsByCurrency([])).toEqual([{ currency: 'TRY', total: 0 }]);
  });
});

describe('totalInMainCurrency', () => {
  it('converts every holding into the main currency', () => {
    const { total, excluded } = totalInMainCurrency(
      [
        { currency: 'TRY', total: 1000 },
        { currency: 'USD', total: 10 },
      ],
      'TRY',
      rates,
    );
    expect(total).toBe(1400);
    expect(excluded).toEqual([]);
  });

  it('excludes and flags holdings without a rate (gold)', () => {
    const { total, excluded } = totalInMainCurrency(
      [
        { currency: 'TRY', total: 1000 },
        { currency: 'GAU', total: 5 },
      ],
      'TRY',
      rates,
    );
    expect(total).toBe(1000);
    expect(excluded).toEqual(['GAU']);
  });

  it('no rates loaded: only main-currency holdings count', () => {
    const { total, excluded } = totalInMainCurrency(
      [
        { currency: 'TRY', total: 1000 },
        { currency: 'USD', total: 10 },
      ],
      'TRY',
      null,
    );
    expect(total).toBe(1000);
    expect(excluded).toEqual(['USD']);
  });
});
