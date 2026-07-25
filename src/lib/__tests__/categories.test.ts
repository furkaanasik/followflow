import {
  CATEGORIES,
  categoriesByType,
  categoryByKey,
  resolveCategories,
} from '@/lib/categories';
import type { UserCategory } from '@/types';

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

describe('resolveCategories', () => {
  const t = (key: string) => key;
  const row = (overrides: Partial<UserCategory>): UserCategory => ({
    id: 'row-1',
    user_id: 'u-1',
    builtin_key: null,
    type: 'expense',
    name: null,
    icon: null,
    color: null,
    hidden: false,
    sort_order: 0,
    created_at: '2026-07-25T00:00:00Z',
    updated_at: '2026-07-25T00:00:00Z',
    ...overrides,
  });

  it('no rows yields all built-ins with default resolution', () => {
    const resolved = resolveCategories(CATEGORIES, [], t);
    expect(resolved).toHaveLength(CATEGORIES.length);
    expect(resolved.every((c) => !c.custom && !c.hidden)).toBe(true);
    const market = resolved.find((c) => c.key === 'market')!;
    expect(market.label).toBe('categories.market');
    expect(market.icon).toBe('shopping-cart');
    expect(market.tint).toBe('accentTeal');
    expect(market.color).toBeUndefined();
  });

  it('override renames and recolors a built-in', () => {
    const resolved = resolveCategories(
      CATEGORIES,
      [row({ builtin_key: 'market', name: 'Gıda', color: '#F59E0B' })],
      t,
    );
    const market = resolved.find((c) => c.key === 'market')!;
    expect(market.label).toBe('Gıda');
    expect(market.color).toBe('#F59E0B');
    expect(market.tint).toBeUndefined();
    expect(market.custom).toBe(false);
  });

  it('override hides a built-in', () => {
    const resolved = resolveCategories(
      CATEGORIES,
      [row({ builtin_key: 'kafe', hidden: true })],
      t,
    );
    expect(resolved.find((c) => c.key === 'kafe')!.hidden).toBe(true);
  });

  it('override without name/icon keeps defaults', () => {
    const resolved = resolveCategories(
      CATEGORIES,
      [row({ builtin_key: 'kira', hidden: true })],
      t,
    );
    const kira = resolved.find((c) => c.key === 'kira')!;
    expect(kira.label).toBe('categories.kira');
    expect(kira.icon).toBe('home');
    expect(kira.tint).toBe('accentTeal');
  });

  it('custom row appears with custom:true and row id as key', () => {
    const resolved = resolveCategories(
      CATEGORIES,
      [
        row({
          id: 'u1',
          name: 'Kahve',
          icon: 'coffee',
          color: '#2DD4BF',
        }),
      ],
      t,
    );
    const custom = resolved.find((c) => c.key === 'u1')!;
    expect(custom.custom).toBe(true);
    expect(custom.label).toBe('Kahve');
    expect(custom.icon).toBe('coffee');
    expect(custom.color).toBe('#2DD4BF');
    expect(custom.tint).toBeUndefined();
    expect(custom.type).toBe('expense');
  });

  it('hidden custom row still resolves', () => {
    const resolved = resolveCategories(
      CATEGORIES,
      [
        row({
          id: 'u2',
          name: 'Gizli',
          icon: 'gift',
          color: '#111111',
          hidden: true,
        }),
      ],
      t,
    );
    const hiddenCustom = resolved.find((c) => c.key === 'u2')!;
    expect(hiddenCustom.hidden).toBe(true);
  });
});
