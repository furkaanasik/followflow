import type { Transaction } from '@/types';

export interface QuickTemplate {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string | null;
  icon: string;
  count: number;
}

// Groups identical past entries (type + category + amount + normalized note),
// ranks by frequency then recency, and returns the top `limit` as one-tap
// prefill templates. Pure — no React, no I/O.
export function deriveQuickTemplates(
  txns: Transaction[],
  limit = 5,
): QuickTemplate[] {
  const groups = new Map<
    string,
    QuickTemplate & { latestOccurredAt: string }
  >();

  for (const t of txns) {
    if (t.amount <= 0) continue;
    // '' and null notes collapse into the same template.
    const note = (t.note ?? '').trim();
    const key = `${t.type}|${t.category}|${t.amount}|${note}`;
    const group = groups.get(key);
    if (group) {
      group.count += 1;
      // ISO-8601 strings (full or YYYY-MM-DD) order correctly lexically.
      if (t.occurred_at > group.latestOccurredAt) {
        group.latestOccurredAt = t.occurred_at;
        group.icon = t.icon;
      }
    } else {
      groups.set(key, {
        type: t.type,
        category: t.category,
        amount: t.amount,
        note: note || null,
        icon: t.icon,
        count: 1,
        latestOccurredAt: t.occurred_at,
      });
    }
  }

  return [...groups.values()]
    .sort(
      (a, b) =>
        b.count - a.count || (a.latestOccurredAt < b.latestOccurredAt ? 1 : -1),
    )
    .slice(0, limit)
    .map(({ latestOccurredAt: _latest, ...tpl }) => tpl);
}
