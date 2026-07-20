import type { ColorTokens } from '@/theme/tokens';

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
