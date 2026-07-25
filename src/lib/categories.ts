import type { ColorTokens } from '@/theme/tokens';
import type { UserCategory } from '@/types';

export type CategoryLabelKey =
  | 'categories.market'
  | 'categories.kira'
  | 'categories.kafe'
  | 'categories.ulasim'
  | 'categories.saglik'
  | 'categories.fatura'
  | 'categories.eglence'
  | 'categories.giyim'
  | 'categories.egitim'
  | 'categories.diger'
  | 'categories.maas'
  | 'categories.freelance';

export interface Category {
  key: string;
  labelKey: CategoryLabelKey;
  icon: string;
  tint: keyof ColorTokens;
  type: 'income' | 'expense';
}

export const CATEGORIES: Category[] = [
  {
    key: 'market',
    labelKey: 'categories.market',
    icon: 'shopping-cart',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'kira',
    labelKey: 'categories.kira',
    icon: 'home',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'kafe',
    labelKey: 'categories.kafe',
    icon: 'coffee',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'ulasim',
    labelKey: 'categories.ulasim',
    icon: 'bus',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'saglik',
    labelKey: 'categories.saglik',
    icon: 'activity',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'fatura',
    labelKey: 'categories.fatura',
    icon: 'receipt',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'eglence',
    labelKey: 'categories.eglence',
    icon: 'tv',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'giyim',
    labelKey: 'categories.giyim',
    icon: 'shirt',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'egitim',
    labelKey: 'categories.egitim',
    icon: 'graduation-cap',
    tint: 'accentTeal',
    type: 'expense',
  },
  {
    key: 'diger_gider',
    labelKey: 'categories.diger',
    icon: 'ellipsis',
    tint: 'textSecondary',
    type: 'expense',
  },
  {
    key: 'maas',
    labelKey: 'categories.maas',
    icon: 'banknote',
    tint: 'incomeGreen',
    type: 'income',
  },
  {
    key: 'freelance',
    labelKey: 'categories.freelance',
    icon: 'laptop',
    tint: 'incomeGreen',
    type: 'income',
  },
  {
    key: 'diger_gelir',
    labelKey: 'categories.diger',
    icon: 'ellipsis',
    tint: 'incomeGreen',
    type: 'income',
  },
];

export const categoriesByType = (type: 'income' | 'expense') =>
  CATEGORIES.filter((c) => c.type === type);

export const categoryByKey = (key: string) =>
  CATEGORIES.find((c) => c.key === key);

export interface ResolvedCategory {
  key: string; // built-in key OR custom row uuid
  label: string; // already translated / custom name
  icon: string;
  tint?: keyof ColorTokens; // built-in default color (theme-reactive)
  color?: string; // hex; wins over tint when set
  type: 'income' | 'expense';
  custom: boolean;
  hidden: boolean;
}

// Pure merge of static built-ins with per-user DB rows (overrides + customs).
export function resolveCategories(
  builtins: Category[],
  rows: UserCategory[],
  t: (key: CategoryLabelKey) => string,
): ResolvedCategory[] {
  const overrides = new Map(
    rows.filter((r) => r.builtin_key !== null).map((r) => [r.builtin_key, r]),
  );
  const resolvedBuiltins: ResolvedCategory[] = builtins.map((b) => {
    const o = overrides.get(b.key);
    return {
      key: b.key,
      label: o?.name ?? t(b.labelKey),
      icon: o?.icon ?? b.icon,
      color: o?.color ?? undefined,
      tint: o?.color ? undefined : b.tint,
      type: b.type,
      custom: false,
      hidden: o?.hidden ?? false,
    };
  });
  const customs: ResolvedCategory[] = rows
    .filter((r) => r.builtin_key === null)
    .map((r) => ({
      key: r.id,
      label: r.name ?? r.id,
      icon: r.icon ?? 'ellipsis',
      color: r.color ?? undefined,
      tint: undefined,
      type: r.type,
      custom: true,
      hidden: r.hidden,
    }));
  return [...resolvedBuiltins, ...customs].sort(
    (a, b) => sortOrderOf(a, rows) - sortOrderOf(b, rows),
  );
}

function sortOrderOf(c: ResolvedCategory, rows: UserCategory[]): number {
  const row = c.custom
    ? rows.find((r) => r.id === c.key)
    : rows.find((r) => r.builtin_key === c.key);
  return row?.sort_order ?? 0;
}
