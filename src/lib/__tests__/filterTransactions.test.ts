import {
  activeFilterCount,
  EMPTY_FILTERS,
  filterTransactions,
  type TransactionFilters,
} from '@/lib/filterTransactions';
import { txn } from '@/test/fixtures';

// local-noon ISO keeps day-precision assertions TZ-agnostic
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00`;

const label = (t: { category: string }) => t.category;

const fixtures = [
  txn({
    id: 'a',
    type: 'expense',
    category: 'market',
    title: 'Migros',
    amount: 100,
    occurred_at: iso(2026, 7, 10),
  }),
  txn({
    id: 'b',
    type: 'income',
    category: 'maas',
    title: 'Temmuz maaş',
    amount: 500,
    occurred_at: iso(2026, 7, 1),
  }),
  txn({
    id: 'c',
    type: 'expense',
    category: 'ulasim',
    title: 'Taksi',
    note: 'havalimanı',
    amount: 300,
    occurred_at: iso(2026, 7, 20),
  }),
];

const ids = (txns: { id: string }[]) => txns.map((t) => t.id);
const filters = (over: Partial<TransactionFilters>): TransactionFilters => ({
  ...EMPTY_FILTERS,
  ...over,
});

describe('filterTransactions', () => {
  it('returns all transactions for empty filters', () => {
    expect(filterTransactions(fixtures, EMPTY_FILTERS, label)).toHaveLength(3);
  });

  it('filters by type', () => {
    expect(
      ids(filterTransactions(fixtures, filters({ type: 'expense' }), label)),
    ).toEqual(['a', 'c']);
  });

  it('filters by a single category', () => {
    expect(
      ids(
        filterTransactions(
          fixtures,
          filters({ categoryKeys: ['market'] }),
          label,
        ),
      ),
    ).toEqual(['a']);
  });

  it('filters by multiple categories as a union', () => {
    expect(
      ids(
        filterTransactions(
          fixtures,
          filters({ categoryKeys: ['market', 'maas'] }),
          label,
        ),
      ),
    ).toEqual(['a', 'b']);
  });

  it('includes a transaction on the from boundary day', () => {
    expect(
      ids(
        filterTransactions(
          fixtures,
          filters({ from: iso(2026, 7, 10) }),
          label,
        ),
      ),
    ).toEqual(['a', 'c']);
  });

  it('includes a transaction on the to boundary day (end-of-day)', () => {
    expect(
      ids(
        filterTransactions(fixtures, filters({ to: iso(2026, 7, 10) }), label),
      ),
    ).toEqual(['a', 'b']);
  });

  it('min/max amount are inclusive', () => {
    expect(
      ids(
        filterTransactions(
          fixtures,
          filters({ minAmount: 100, maxAmount: 300 }),
          label,
        ),
      ),
    ).toEqual(['a', 'c']);
  });

  it('matches query against the note', () => {
    expect(
      ids(
        filterTransactions(fixtures, filters({ query: 'havalimanı' }), label),
      ),
    ).toEqual(['c']);
  });

  it('matches query against the category label', () => {
    expect(
      ids(filterTransactions(fixtures, filters({ query: 'ulasim' }), label)),
    ).toEqual(['c']);
  });

  it('ANDs all filters together', () => {
    expect(
      ids(
        filterTransactions(
          fixtures,
          filters({
            type: 'expense',
            categoryKeys: ['market', 'ulasim'],
            minAmount: 200,
          }),
          label,
        ),
      ),
    ).toEqual(['c']);
  });

  it('returns empty for an inverted range', () => {
    expect(
      filterTransactions(
        fixtures,
        filters({ from: iso(2026, 7, 20), to: iso(2026, 7, 1) }),
        label,
      ),
    ).toHaveLength(0);
  });

  it('handles an empty transaction list', () => {
    expect(filterTransactions([], filters({ query: 'x' }), label)).toEqual([]);
  });
});

describe('activeFilterCount', () => {
  it('returns 0 for empty filters', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
  });

  it('ignores query and type', () => {
    expect(activeFilterCount(filters({ query: 'a', type: 'income' }))).toBe(0);
  });

  it('counts each group once', () => {
    expect(activeFilterCount(filters({ categoryKeys: ['market'] }))).toBe(1);
    expect(activeFilterCount(filters({ from: iso(2026, 7, 1) }))).toBe(1);
    expect(activeFilterCount(filters({ to: iso(2026, 7, 1) }))).toBe(1);
    expect(activeFilterCount(filters({ minAmount: 1 }))).toBe(1);
    expect(activeFilterCount(filters({ maxAmount: 1 }))).toBe(1);
  });

  it('counts category + date + amount as 3', () => {
    expect(
      activeFilterCount(
        filters({
          categoryKeys: ['market'],
          from: iso(2026, 7, 1),
          minAmount: 10,
        }),
      ),
    ).toBe(3);
  });
});
