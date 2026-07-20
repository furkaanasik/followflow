// Shared state machine for the in-app numpad amount input
// (NewTransaction / GoalDeposit / NewBudget sheets).
export const NUMPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

export function formatAmountInput(raw: string): string {
  if (!raw) return '₺0';
  const [intPart, decPart] = raw.split('.');
  const grouped = new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 0,
  }).format(Number(intPart || '0'));
  const dec = raw.includes('.') ? `,${decPart ?? ''}` : '';
  return `₺${grouped}${dec}`;
}

// Applies one numpad key to the raw value: max two decimals, max 12 chars,
// no leading zero, single decimal separator.
export function nextAmountRaw(prev: string, key: string): string {
  if (key === '⌫') return prev.slice(0, -1);
  if (key === '.') {
    if (prev.includes('.')) return prev;
    return prev === '' ? '0.' : `${prev}.`;
  }
  if (prev.includes('.')) {
    const [, dec] = prev.split('.');
    if (dec.length >= 2) return prev;
  }
  if (prev.length >= 12) return prev;
  if (prev === '0') return key;
  return prev + key;
}
