import { deriveQuickTemplates } from '@/lib/quickTemplates';
import { txn } from '@/test/fixtures';

describe('deriveQuickTemplates', () => {
  it('returns [] for an empty list', () => {
    expect(deriveQuickTemplates([])).toEqual([]);
  });

  it('turns a single txn into one template with count 1', () => {
    const result = deriveQuickTemplates([txn({ amount: 500, note: 'Market' })]);
    expect(result).toEqual([
      {
        type: 'expense',
        category: 'market',
        amount: 500,
        note: 'Market',
        icon: 'shopping-cart',
        count: 1,
      },
    ]);
  });

  it('collapses identical entries into one template with the total count', () => {
    const rows = [1, 2, 3].map((d) =>
      txn({ amount: 500, note: 'Market', occurred_at: `2026-07-0${d}` }),
    );
    const result = deriveQuickTemplates(rows);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
  });

  it('collapses null and empty-string notes together', () => {
    const result = deriveQuickTemplates([
      txn({ amount: 300, note: null }),
      txn({ amount: 300, note: '' }),
      txn({ amount: 300, note: '  ' }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
    expect(result[0].note).toBeNull();
  });

  it('ranks more frequent templates first', () => {
    const result = deriveQuickTemplates([
      txn({ category: 'kahve', amount: 85 }),
      txn({ category: 'market', amount: 500 }),
      txn({ category: 'market', amount: 500 }),
      txn({ category: 'market', amount: 500 }),
    ]);
    expect(result[0].category).toBe('market');
    expect(result[1].category).toBe('kahve');
  });

  it('breaks count ties by most recent occurred_at', () => {
    const result = deriveQuickTemplates([
      txn({ category: 'kahve', amount: 85, occurred_at: '2026-07-01' }),
      txn({ category: 'kahve', amount: 85, occurred_at: '2026-07-02' }),
      txn({ category: 'market', amount: 500, occurred_at: '2026-07-10' }),
      txn({ category: 'market', amount: 500, occurred_at: '2026-07-11' }),
    ]);
    expect(result[0].category).toBe('market');
  });

  it('respects the limit', () => {
    const rows = [1, 2, 3, 4, 5, 6].map((i) =>
      txn({ category: `cat-${i}`, amount: i * 10 }),
    );
    expect(deriveQuickTemplates(rows, 5)).toHaveLength(5);
  });

  it('excludes rows with amount <= 0', () => {
    const result = deriveQuickTemplates([
      txn({ amount: 0 }),
      txn({ amount: -50 }),
    ]);
    expect(result).toEqual([]);
  });

  it('keeps income and expense with same category/amount distinct', () => {
    const result = deriveQuickTemplates([
      txn({ type: 'income', category: 'market', amount: 500 }),
      txn({ type: 'expense', category: 'market', amount: 500 }),
    ]);
    expect(result).toHaveLength(2);
  });
});
