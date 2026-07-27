import {
  convert,
  GRAMS_PER_TROY_OUNCE,
  isGold,
  rateInTry,
  SUPPORTED_CURRENCIES,
  symbolFor,
  toCurrencyCode,
  type RatesTable,
} from '@/lib/currency';

const rates: RatesTable = {
  base: 'TRY',
  rates: { USD: 40, EUR: 44, GAU: 4300 },
  asOf: '2026-07-27',
};

const noGold: RatesTable = {
  base: 'TRY',
  rates: { USD: 40, EUR: 44 },
  asOf: '2026-07-27',
};

describe('convert', () => {
  it('same currency is identity even with empty rates', () => {
    expect(
      convert(100, 'USD', 'USD', { base: 'TRY', rates: {}, asOf: '' }),
    ).toBe(100);
  });

  it('USD → TRY multiplies by the per-unit TRY value', () => {
    expect(convert(10, 'USD', 'TRY', rates)).toBe(400);
  });

  it('TRY → USD divides by the per-unit TRY value', () => {
    expect(convert(400, 'TRY', 'USD', rates)).toBe(10);
  });

  it('cross-currency pivots through TRY (USD → EUR)', () => {
    expect(convert(11, 'USD', 'EUR', rates)).toBe(10);
  });

  it('gram gold converts via its TRY rate', () => {
    expect(convert(2, 'GAU', 'TRY', rates)).toBe(8600);
  });

  it('returns null when a needed rate is missing (gold)', () => {
    expect(convert(2, 'GAU', 'TRY', noGold)).toBeNull();
    expect(convert(100, 'TRY', 'GAU', noGold)).toBeNull();
  });

  it('returns null on zero/invalid rate instead of Infinity', () => {
    const bad: RatesTable = {
      base: 'TRY',
      rates: { USD: 0 },
      asOf: '2026-07-27',
    };
    expect(convert(1, 'TRY', 'USD', bad)).toBeNull();
  });
});

describe('rateInTry', () => {
  it('TRY is always 1', () => {
    expect(rateInTry('TRY', noGold)).toBe(1);
  });

  it('missing rate is null', () => {
    expect(rateInTry('GAU', noGold)).toBeNull();
  });
});

describe('gram gold derivation', () => {
  it('ounce price divides into gram price', () => {
    const ounceInTry = 31.1034768 * 4300;
    const gramInTry = ounceInTry / GRAMS_PER_TROY_OUNCE;
    expect(gramInTry).toBeCloseTo(4300, 6);
  });
});

describe('helpers', () => {
  it('isGold only for GAU', () => {
    expect(isGold('GAU')).toBe(true);
    expect(isGold('TRY')).toBe(false);
  });

  it('symbols', () => {
    expect(symbolFor('TRY')).toBe('₺');
    expect(symbolFor('USD')).toBe('$');
    expect(symbolFor('EUR')).toBe('€');
    expect(symbolFor('GAU')).toBe('gr');
  });

  it('supported set', () => {
    expect(SUPPORTED_CURRENCIES).toEqual(['TRY', 'USD', 'EUR', 'GAU']);
  });

  it('toCurrencyCode validates DB strings, falls back to TRY', () => {
    expect(toCurrencyCode('USD')).toBe('USD');
    expect(toCurrencyCode('GAU')).toBe('GAU');
    expect(toCurrencyCode('XYZ')).toBe('TRY');
    expect(toCurrencyCode('')).toBe('TRY');
    expect(toCurrencyCode(null)).toBe('TRY');
    expect(toCurrencyCode(undefined)).toBe('TRY');
  });
});
