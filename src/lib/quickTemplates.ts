import type { Transaction } from '@/types';

export interface QuickTemplate {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  note: string | null;
  icon: string;
  count: number;
}

// Only the most recent entries feed template derivation, so current habits
// outrank years-old ones and the grouping cost stays bounded as history grows.
const RECENT_WINDOW = 200;

// Groups identical past entries (type + category + amount + normalized note),
// ranks by frequency then recency, and returns the top `limit` as one-tap
// prefill templates. Pure — no React, no I/O.
export function deriveQuickTemplates(
  txns: Transaction[],
  limit = 5,
  window = RECENT_WINDOW,
): QuickTemplate[] {
  const recent = [...txns]
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, window);

  const groups = new Map<
    string,
    QuickTemplate & { latestOccurredAt: string }
  >();

  for (const t of recent) {
    if (!Number.isFinite(t.amount) || t.amount <= 0) continue;
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
        b.count - a.count ||
        b.latestOccurredAt.localeCompare(a.latestOccurredAt),
    )
    .slice(0, limit)
    .map(({ latestOccurredAt: _latest, ...tpl }) => tpl);
}
