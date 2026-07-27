import type { Transaction } from '@/types';

// Columns are machine-friendly (dot decimals, ISO date) so the file re-imports
// cleanly; the in-app UI keeps its own TR formatting.
const HEADERS = ['Tarih', 'Tür', 'Kategori', 'Başlık', 'Not', 'Tutar'] as const;

function escapeField(value: string): string {
  // RFC 4180: wrap in quotes if it contains comma, quote, CR or LF; double inner quotes.
  if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

// User-entered text can start with =, +, -, @ or tab, which spreadsheets treat
// as a formula (CSV injection). Prefix with ' so Excel/Sheets render it inert.
function sanitizeText(value: string): string {
  return /^[=+\-@\t]/.test(value) ? `'${value}` : value;
}

export function toCsv(
  txns: Transaction[],
  categoryLabel: (txn: Transaction) => string,
): string {
  const rows = txns.map((t) =>
    [
      t.occurred_at.slice(0, 10), // YYYY-MM-DD
      t.type === 'income' ? 'Gelir' : 'Gider',
      sanitizeText(categoryLabel(t)),
      sanitizeText(t.title),
      sanitizeText(t.note ?? ''),
      String(t.amount),
    ]
      .map(escapeField)
      .join(','),
  );
  // BOM so Excel reads UTF-8 Turkish chars; CRLF line endings per RFC 4180.
  return '﻿' + [HEADERS.join(','), ...rows].join('\r\n') + '\r\n';
}
