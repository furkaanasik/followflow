import { toCsv } from '@/lib/toCsv';
import { txn } from '@/test/fixtures';

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00`;

const label = (t: { category: string }) => t.category;

const BOM = '﻿';
const HEADER = 'Tarih,Tür,Kategori,Başlık,Not,Tutar';

const lines = (csv: string) => csv.replace(BOM, '').split('\r\n');

describe('toCsv', () => {
  it('starts with a UTF-8 BOM', () => {
    expect(toCsv([], label).startsWith(BOM)).toBe(true);
  });

  it('puts the header row first', () => {
    expect(lines(toCsv([txn()], label))[0]).toBe(HEADER);
  });

  it('maps all 6 columns in order', () => {
    const csv = toCsv(
      [
        txn({
          type: 'expense',
          category: 'market',
          title: 'Migros',
          note: 'haftalık',
          amount: 123.45,
          occurred_at: iso(2026, 7, 10),
        }),
      ],
      label,
    );
    expect(lines(csv)[1]).toBe(
      '2026-07-10,Gider,market,Migros,haftalık,123.45',
    );
  });

  it('maps income to Gelir and expense to Gider', () => {
    const csv = toCsv(
      [txn({ type: 'income' }), txn({ type: 'expense' })],
      label,
    );
    expect(lines(csv)[1]).toContain(',Gelir,');
    expect(lines(csv)[2]).toContain(',Gider,');
  });

  it('renders a null note as an empty field', () => {
    const csv = toCsv(
      [txn({ title: 'Taksi', note: null, amount: 300 })],
      label,
    );
    expect(lines(csv)[1]).toContain('Taksi,,300');
  });

  it('quotes a field containing a comma', () => {
    const csv = toCsv([txn({ title: 'Market, ev' })], label);
    expect(lines(csv)[1]).toContain('"Market, ev"');
  });

  it('doubles and quotes inner quotes', () => {
    const csv = toCsv([txn({ title: 'A "B"' })], label);
    expect(lines(csv)[1]).toContain('"A ""B"""');
  });

  it('quotes a field containing a newline', () => {
    const csv = toCsv([txn({ title: 'a\nb' })], label);
    expect(csv).toContain('"a\nb"');
  });

  it('uses the injected categoryLabel for the Kategori column', () => {
    const csv = toCsv([txn({ category: 'market' })], () => 'Custom Label');
    expect(lines(csv)[1]).toContain(',Custom Label,');
  });

  it('neutralizes formula-like text fields (CSV injection)', () => {
    const csv = toCsv(
      [txn({ title: '=HYPERLINK("http://evil","x")', note: '+SUM(A1)' })],
      () => '@cat',
    );
    const row = lines(csv)[1];
    expect(row).toContain(`'=HYPERLINK`);
    expect(row).toContain(`'+SUM(A1)`);
    expect(row).toContain(`'@cat`);
  });

  it('does not touch the numeric amount column', () => {
    const csv = toCsv([txn({ amount: 42 })], label);
    expect(lines(csv)[1].endsWith(',42')).toBe(true);
  });

  it('returns BOM + header + trailing CRLF for an empty list', () => {
    expect(toCsv([], label)).toBe(`${BOM}${HEADER}\r\n`);
  });
});
