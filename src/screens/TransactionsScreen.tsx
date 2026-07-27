import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonIconOnly } from '@/atoms';
import { groupByDate } from '@/lib/aggregate';
import {
  activeFilterCount,
  EMPTY_FILTERS,
  filterTransactions,
  type TransactionFilters,
} from '@/lib/filterTransactions';
import { exportTransactionsCsv } from '@/lib/exportCsv';
import { formatCurrency, formatDate } from '@/lib/format';
import { toCsv } from '@/lib/toCsv';
import { useCategories } from '@/lib/useCategories';
import { SearchBar, SegmentedToggle, StateView } from '@/molecules';
import {
  AppBarSimpleTitle,
  TransactionFilterPanel,
  TransactionListCard,
} from '@/organisms';
import {
  useDeleteTransactionMutation,
  useListTransactionsQuery,
} from '@/store/api';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';
import type { Transaction } from '@/types';

export function TransactionsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);

  const {
    data: transactions = [],
    isLoading,
    isError,
    refetch,
  } = useListTransactionsQuery();
  const [deleteTransaction] = useDeleteTransactionMutation();
  const { byKey } = useCategories();

  // Reload when the tab regains focus instead of pull-to-refresh; deferred
  // so the tab switch renders instantly and the refetch runs after.
  useFocusEffect(
    useCallback(() => {
      const handle = requestIdleCallback(() => refetch());
      return () => cancelIdleCallback(handle);
    }, [refetch]),
  );

  function confirmDelete(id: string) {
    Alert.alert(
      t('transactions.deleteTitle'),
      t('transactions.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('transactions.delete'),
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id)
              .unwrap()
              .catch(() => {
                Alert.alert(t('transactions.deleteFailed'));
              });
          },
        },
      ],
    );
  }

  const categoryLabel = useCallback(
    (txn: Transaction) => byKey(txn.category)?.label ?? txn.category,
    [byKey],
  );

  const filtered = useMemo(
    () => filterTransactions(transactions, filters, categoryLabel),
    [transactions, filters, categoryLabel],
  );
  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  async function handleExport() {
    if (filtered.length === 0) {
      Alert.alert(t('transactions.exportEmpty'));
      return;
    }
    try {
      const ok = await exportTransactionsCsv(toCsv(filtered, categoryLabel));
      if (!ok) Alert.alert(t('transactions.exportUnavailable'));
    } catch {
      Alert.alert(t('transactions.exportFailed'));
    }
  }

  const advancedCount = activeFilterCount(filters);

  function rowProps(txn: Transaction) {
    const cat = byKey(txn.category);
    return {
      id: txn.id,
      icon: txn.icon,
      iconTint: (cat?.tint ?? 'accentTeal') as keyof ColorTokens,
      iconColor: cat?.color,
      title: txn.title,
      subtitle: `${categoryLabel(txn)} · ${formatDate(txn.occurred_at, { day: 'numeric', month: 'short', year: undefined })}`,
      tone: (txn.type === 'income' ? 'income' : 'expense') as
        'income' | 'expense',
      amount: `${txn.type === 'income' ? '+' : '-'}${formatCurrency(txn.amount)}`,
    };
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <AppBarSimpleTitle title={t('transactions.title')} />
          <View style={styles.headerActions}>
            <ButtonIconOnly
              icon="share"
              variant="surface"
              size={44}
              accessibilityLabel={t('transactions.export')}
              onPress={handleExport}
            />
            <ButtonIconOnly
              icon="plus"
              variant="accent"
              size={44}
              accessibilityLabel={t('home.addTransaction')}
              onPress={() => router.push('/yeni-islem')}
            />
          </View>
        </View>

        <SearchBar
          value={filters.query}
          onChangeText={(query) => setFilters((f) => ({ ...f, query }))}
          placeholder={t('transactions.searchPlaceholder')}
          filterLabel={t('transactions.filter')}
          filterCount={advancedCount}
          onFilterPress={() => setPanelOpen((v) => !v)}
        />

        <SegmentedToggle
          options={[
            { label: t('transactions.filterAll'), value: 'all' },
            { label: t('common.gelir'), value: 'income' },
            { label: t('common.gider'), value: 'expense' },
          ]}
          value={filters.type}
          onChange={(value) =>
            setFilters((f) => ({
              ...f,
              type: value as 'all' | 'income' | 'expense',
            }))
          }
        />

        {panelOpen ? (
          <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOutUp.duration(180)}
          >
            <TransactionFilterPanel
              filters={filters}
              onChange={setFilters}
              onClear={() =>
                setFilters((f) => ({
                  ...EMPTY_FILTERS,
                  query: f.query,
                  type: f.type,
                }))
              }
            />
          </Animated.View>
        ) : null}

        <Animated.View
          layout={LinearTransition.duration(220)}
          style={{ gap: theme.spacing.md }}
        >
          {isLoading ? (
            <StateView variant="loading" />
          ) : isError ? (
            <StateView variant="error" onRetry={refetch} />
          ) : groups.length > 0 ? (
            groups.map((group) => (
              <TransactionListCard
                key={group.bucket}
                dateLabel={t(`transactions.${group.bucket}`)}
                transactions={group.items.map(rowProps)}
                editLabel={t('transactions.edit')}
                deleteLabel={t('transactions.delete')}
                onEditItem={(id) =>
                  router.push({ pathname: '/yeni-islem', params: { id } })
                }
                onDeleteItem={confirmDelete}
              />
            ))
          ) : (
            <StateView
              variant="empty"
              icon="receipt"
              message={t('transactions.empty')}
            />
          )}
        </Animated.View>
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
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
