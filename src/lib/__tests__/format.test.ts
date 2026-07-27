import { formatCurrency, formatNumber, parseAmount } from '@/lib/format';

describe('parseAmount', () => {
  it('parses TR format (dot grouping, comma decimal)', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56);
  });

  it('parses plain format (dot decimal)', () => {
    expect(parseAmount('1234.56')).toBe(1234.56);
  });

  it('treats lone comma as decimal separator', () => {
    expect(parseAmount('1234,56')).toBe(1234.56);
  });

  it('strips currency symbol and spaces', () => {
    expect(parseAmount('₺ 1.000,50')).toBe(1000.5);
  });

  it('lone dot reads as decimal separator (ambiguous TR grouping)', () => {
    expect(parseAmount('1.000')).toBe(1);
  });

  it('empty and non-numeric input yield NaN, not 0', () => {
    expect(Number.isNaN(parseAmount(''))).toBe(true);
    expect(Number.isNaN(parseAmount('abc'))).toBe(true);
  });

  it('handles negatives', () => {
    expect(parseAmount('-50,5')).toBe(-50.5);
  });
});

describe('formatCurrency', () => {
  it('formats TRY with tr-TR grouping (default currency)', () => {
    const out = formatCurrency(1234.5);
    expect(out).toContain('₺');
    expect(out).toContain('1.234,5');
  });

  it('formats USD with dollar symbol', () => {
    const out = formatCurrency(10, 'USD');
    expect(out).toContain('$');
    expect(out).toContain('10,00');
  });

  it('formats EUR with euro symbol', () => {
    expect(formatCurrency(5, 'EUR')).toContain('€');
  });

  it('formats gram gold without Intl currency style', () => {
    expect(formatCurrency(12.5, 'GAU')).toBe('12,5 gr');
  });

  it('gram gold groups with tr-TR dots', () => {
    expect(formatCurrency(1000, 'GAU')).toBe('1.000 gr');
  });
});

describe('formatNumber', () => {
  it('groups with tr-TR dots', () => {
    expect(formatNumber(1000)).toBe('1.000');
  });
});
