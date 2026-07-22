import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonIconOnly } from '@/atoms';
import { budgetProgress, currentPeriodMonth } from '@/lib/aggregate';
import { categoryByKey } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/format';
import { TitleSubtitle } from '@/molecules';
import { BudgetCard } from '@/organisms';
import { useListBudgetsQuery, useListTransactionsQuery } from '@/store/api';
import { useTheme } from '@/theme';
import type { Budget } from '@/types';

export function BudgetsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: budgets = [], refetch: refetchBudgets } =
    useListBudgetsQuery(currentPeriodMonth());
  const { data: transactions = [], refetch: refetchTransactions } =
    useListTransactionsQuery();

  // Reload when the tab regains focus instead of pull-to-refresh; deferred
  // so the tab switch renders instantly and the refetch runs after.
  useFocusEffect(
    useCallback(() => {
      const handle = requestIdleCallback(() => {
        refetchBudgets();
        refetchTransactions();
      });
      return () => cancelIdleCallback(handle);
    }, [refetchBudgets, refetchTransactions]),
  );

  const progress = budgetProgress(budgets, transactions);
  const monthLabel = formatDate(new Date(), {
    day: undefined,
    month: 'long',
    year: 'numeric',
  });

  function displayName(budget: Budget) {
    const cat = categoryByKey(budget.category_name);
    return cat ? t(cat.labelKey) : budget.category_name;
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TitleSubtitle
            title={t('budgets.title')}
            subtitle={t('budgets.subtitle', {
              month: monthLabel,
              count: budgets.length,
            })}
          />
          <ButtonIconOnly
            icon="plus"
            variant="accent"
            size={36}
            accessibilityLabel={t('budgets.add')}
            onPress={() => router.push('/yeni-butce')}
          />
        </View>

        {progress.length > 0 ? (
          progress.map((item) => (
            <Pressable
              key={item.budget.id}
              onPress={() =>
                router.push({
                  pathname: '/yeni-butce',
                  params: { id: item.budget.id },
                })
              }
            >
              <BudgetCard
                icon={item.budget.icon}
                categoryName={displayName(item.budget)}
                percent={Math.round(item.percent)}
                overLimit={item.over}
                footerLabel={
                  item.over
                    ? t('budgets.overBy', {
                        amount: formatCurrency(
                          item.spent - item.budget.limit_amount,
                        ),
                      })
                    : t('budgets.remaining', {
                        amount: formatCurrency(
                          item.budget.limit_amount - item.spent,
                        ),
                      })
                }
              />
            </Pressable>
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
            {t('budgets.empty')}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
});
