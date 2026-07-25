import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonIconOnly } from '@/atoms';
import { groupByDate } from '@/lib/aggregate';
import { formatCurrency, formatDate } from '@/lib/format';
import { useCategories } from '@/lib/useCategories';
import { SearchBar, SegmentedToggle, StateView } from '@/molecules';
import { AppBarSimpleTitle, TransactionListCard } from '@/organisms';
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
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>(
    'all',
  );

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

  function categoryLabel(txn: Transaction) {
    return byKey(txn.category)?.label ?? txn.category;
  }

  const q = query.trim().toLowerCase();
  const filtered = transactions.filter((txn) => {
    if (typeFilter !== 'all' && txn.type !== typeFilter) return false;
    if (!q) return true;
    const haystack = [txn.title, categoryLabel(txn), txn.note ?? '']
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const groups = groupByDate(filtered);

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
          <ButtonIconOnly
            icon="plus"
            variant="accent"
            size={44}
            accessibilityLabel={t('home.addTransaction')}
            onPress={() => router.push('/yeni-islem')}
          />
        </View>

        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t('transactions.searchPlaceholder')}
        />

        <SegmentedToggle
          options={[
            { label: t('transactions.filterAll'), value: 'all' },
            { label: t('common.gelir'), value: 'income' },
            { label: t('common.gider'), value: 'expense' },
          ]}
          value={typeFilter}
          onChange={(value) =>
            setTypeFilter(value as 'all' | 'income' | 'expense')
          }
        />

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
});
