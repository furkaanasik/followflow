import { formatAmountInput, nextAmountRaw } from '@/lib/amountInput';

describe('nextAmountRaw', () => {
  it('appends digits', () => {
    expect(nextAmountRaw('', '5')).toBe('5');
    expect(nextAmountRaw('5', '0')).toBe('50');
  });

  it('replaces leading zero', () => {
    expect(nextAmountRaw('0', '5')).toBe('5');
  });

  it('decimal point: empty → 0., single separator only', () => {
    expect(nextAmountRaw('', '.')).toBe('0.');
    expect(nextAmountRaw('12', '.')).toBe('12.');
    expect(nextAmountRaw('12.3', '.')).toBe('12.3');
  });

  it('caps at two decimals', () => {
    expect(nextAmountRaw('1.23', '4')).toBe('1.23');
    expect(nextAmountRaw('1.2', '3')).toBe('1.23');
  });

  it('caps length at 12 chars', () => {
    const twelve = '123456789012';
    expect(twelve).toHaveLength(12);
    expect(nextAmountRaw(twelve, '3')).toBe(twelve);
  });

  it('backspace removes last char, no-op on empty', () => {
    expect(nextAmountRaw('123', '⌫')).toBe('12');
    expect(nextAmountRaw('', '⌫')).toBe('');
  });
});

describe('formatAmountInput', () => {
  it('empty → ₺0', () => {
    expect(formatAmountInput('')).toBe('₺0');
  });

  it('groups thousands with tr-TR dots', () => {
    expect(formatAmountInput('1234')).toBe('₺1.234');
  });

  it('renders decimal part after comma', () => {
    expect(formatAmountInput('1234.5')).toBe('₺1.234,5');
  });

  it('keeps trailing comma while typing decimals', () => {
    expect(formatAmountInput('1234.')).toBe('₺1.234,');
  });
});
