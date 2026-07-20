import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonIconOnly } from '@/atoms';
import { groupByDate } from '@/lib/aggregate';
import { categoryByKey } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/format';
import { SearchBar, SegmentedToggle } from '@/molecules';
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

  const { data: transactions = [], refetch } = useListTransactionsQuery();
  const [deleteTransaction] = useDeleteTransactionMutation();

  // Reload when the tab regains focus instead of pull-to-refresh; deferred
  // so the tab switch renders instantly and the refetch runs after.
  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => refetch());
      return () => task.cancel();
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
    const cat = categoryByKey(txn.category);
    return cat ? t(cat.labelKey) : txn.category;
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
    const cat = categoryByKey(txn.category);
    return {
      id: txn.id,
      icon: txn.icon,
      iconTint: (cat?.tint ?? 'accentTeal') as keyof ColorTokens,
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

        {groups.length > 0 ? (
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
          <Text
            style={{
              fontFamily: theme.fonts.body.medium,
              fontSize: 13,
              color: theme.colors.textTertiary,
              paddingTop: theme.spacing.lg,
            }}
          >
            {t('transactions.empty')}
          </Text>
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
