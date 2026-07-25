import { CATEGORIES, categoriesByType, categoryByKey } from '@/lib/categories';

describe('categoriesByType', () => {
  it('returns only income categories', () => {
    const income = categoriesByType('income');
    expect(income.map((c) => c.key).sort()).toEqual([
      'diger_gelir',
      'freelance',
      'maas',
    ]);
    expect(income.every((c) => c.type === 'income')).toBe(true);
  });

  it('returns 10 expense categories', () => {
    const expense = categoriesByType('expense');
    expect(expense).toHaveLength(10);
    expect(expense.every((c) => c.type === 'expense')).toBe(true);
  });
});

describe('categoryByKey', () => {
  it('finds category by key', () => {
    expect(categoryByKey('market')?.icon).toBe('shopping-cart');
  });

  it('unknown key yields undefined', () => {
    expect(categoryByKey('nope')).toBeUndefined();
  });
});

describe('CATEGORIES integrity', () => {
  it('keys are unique', () => {
    const keys = CATEGORIES.map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
