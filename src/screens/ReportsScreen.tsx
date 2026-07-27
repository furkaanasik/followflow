import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCurrency, formatDate } from '@/lib/format';
import { toCurrencyCode } from '@/lib/currency';
import { categoryHeatmap, monthlyTrend, yearlyTrend } from '@/lib/reports';
import { useCategories } from '@/lib/useCategories';
import { SegmentedToggle, StateView } from '@/molecules';
import { AppBarBackTitle, CategoryHeatmap, TrendChart } from '@/organisms';
import {
  useGetProfileQuery,
  useListTransactionsQuery,
  useRates,
} from '@/store/api';
import { useTheme } from '@/theme';

const WINDOW_MONTHS = 6;

export function ReportsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { byKey } = useCategories();

  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const txnsQuery = useListTransactionsQuery();
  const { data: profile } = useGetProfileQuery();
  const { rates } = useRates();
  const mainCurrency = toCurrencyCode(profile?.main_currency);
  const convertOpts = useMemo(
    () => (rates ? { convertTo: mainCurrency, rates } : undefined),
    [rates, mainCurrency],
  );
  const refetch = txnsQuery.refetch;

  useFocusEffect(
    useCallback(() => {
      const handle = requestIdleCallback(() => refetch());
      return () => cancelIdleCallback(handle);
    }, [refetch]),
  );

  const txns = txnsQuery.data;

  const points = useMemo(() => {
    const series =
      period === 'monthly'
        ? monthlyTrend(txns ?? [], WINDOW_MONTHS, new Date(), convertOpts)
        : yearlyTrend(txns ?? [], 3, new Date(), convertOpts);
    return series.map((p) => ({
      key: p.key,
      label:
        period === 'monthly'
          ? formatDate(new Date(p.year, p.monthIndex, 1), {
              day: undefined,
              month: 'short',
              year: undefined,
            })
          : String(p.year),
      income: p.income,
      expense: p.expense,
      incomeAmount: formatCurrency(p.income, mainCurrency),
      expenseAmount: formatCurrency(p.expense, mainCurrency),
      current: p.current,
    }));
  }, [txns, period, convertOpts, mainCurrency]);

  const heatmap = useMemo(() => {
    const data = categoryHeatmap(txns ?? [], WINDOW_MONTHS, new Date(), convertOpts);
    const monthLabels = data.months.map((m) =>
      formatDate(new Date(m.year, m.monthIndex, 1), {
        day: undefined,
        month: 'short',
        year: undefined,
      }),
    );
    const rows = data.categories.map((category) => ({
      category,
      label: byKey(category)?.label ?? category,
      cells: data.months.map((m) => {
        const total = data.cells.get(`${m.key}|${category}`) ?? 0;
        return {
          key: m.key,
          intensity: data.max > 0 ? total / data.max : 0,
          amount: formatCurrency(total),
        };
      }),
    }));
    return { monthLabels, rows };
  }, [txns, byKey, convertOpts]);

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appBar}>
          <AppBarBackTitle
            title={t('reports.title')}
            onBack={() => router.back()}
          />
        </View>

        {txnsQuery.isLoading ? (
          <StateView variant="loading" />
        ) : txnsQuery.isError ? (
          <StateView variant="error" onRetry={refetch} />
        ) : (
          <>
            <SegmentedToggle
              options={[
                { label: t('reports.monthly'), value: 'monthly' },
                { label: t('reports.yearly'), value: 'yearly' },
              ]}
              value={period}
              onChange={(value) => setPeriod(value as 'monthly' | 'yearly')}
            />

            <TrendChart
              key={period}
              title={t('reports.trend')}
              points={points}
              emptyLabel={t('reports.empty')}
              incomeLabel={t('reports.income')}
              expenseLabel={t('reports.expense')}
            />

            <CategoryHeatmap
              title={t('reports.heatmap')}
              monthLabels={heatmap.monthLabels}
              rows={heatmap.rows}
              emptyLabel={t('reports.empty')}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
