import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useListCategoriesQuery } from '@/store/api';

import {
  CATEGORIES,
  resolveCategories,
  type ResolvedCategory,
} from './categories';

export function useCategories() {
  const { t } = useTranslation();
  const { data: rows, refetch } = useListCategoriesQuery();
  const resolved = useMemo(
    () => resolveCategories(CATEGORIES, rows ?? [], t),
    [rows, t],
  );
  const byType = useCallback(
    (type: 'income' | 'expense'): ResolvedCategory[] =>
      resolved.filter((c) => c.type === type && !c.hidden),
    [resolved],
  );
  const byKey = useCallback(
    (key: string): ResolvedCategory | undefined =>
      resolved.find((c) => c.key === key),
    [resolved],
  );
  return { all: resolved, byType, byKey, refetch };
}
