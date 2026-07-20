import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { ButtonIconOnly } from '@/atoms';
import {
  budgetProgress,
  bucketFor,
  currentPeriodMonth,
  expenseByCategory,
  monthSummary,
  monthlyIncomeTotal,
  nextUpcomingPayment,
  type DateBucket,
} from '@/lib/aggregate';
import { categoryByKey } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/format';
import { elevatedShadow } from '@/lib/shadow';
import { BudgetProgressRow, InfoRowChevron, TransactionRow } from '@/molecules';
import {
  CategoryBreakdownCard,
  NetDurumCard,
  type BreakdownSlice,
} from '@/organisms';
import {
  useGetProfileQuery,
  useListBudgetsQuery,
  useListIncomeSourcesQuery,
  useListRecurringPaymentsQuery,
  useListTransactionsQuery,
} from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';
import type { Transaction } from '@/types';

// Fixed chart palette from the design file (rank order, largest slice first);
// the last gray is reserved for the aggregated "Diğer" slice.
const CHART_PALETTE = ['#3ECF9A', '#6FA8DC', '#E0A458', '#B39DDB'];
const CHART_OTHER_COLOR = '#5C6C71';

export function HomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const session = useAppSelector((s) => s.auth.session);
  const { data: profile } = useGetProfileQuery();
  const { data: transactions = [], isLoading: txnsLoading } =
    useListTransactionsQuery();
  const { data: budgets = [] } = useListBudgetsQuery(currentPeriodMonth());
  const { data: incomeSources = [] } = useListIncomeSourcesQuery();
  const { data: recurringPayments = [] } = useListRecurringPaymentsQuery();

  const summary = monthSummary(transactions);
  const regularIncome = monthlyIncomeTotal(incomeSources);
  const upcoming = nextUpcomingPayment(recurringPayments);

  const byCategory = expenseByCategory(transactions);
  const top = byCategory.slice(0, CHART_PALETTE.length);
  const rest = byCategory.slice(CHART_PALETTE.length);
  const restTotal = rest.reduce((sum, s) => sum + s.total, 0);
  const totalExpense = byCategory.reduce((sum, s) => sum + s.total, 0);
  const slices: BreakdownSlice[] = top.map((slice, index) => {
    const cat = categoryByKey(slice.category);
    return {
      category: slice.category,
      label: cat ? t(cat.labelKey) : slice.category,
      total: slice.total,
      amount: formatCurrency(slice.total),
      color: CHART_PALETTE[index],
    };
  });
  if (restTotal > 0) {
    slices.push({
      category: 'other',
      label: t('categories.diger'),
      total: restTotal,
      amount: formatCurrency(restTotal),
      color: CHART_OTHER_COLOR,
    });
  }

  const progress = budgetProgress(budgets, transactions);
  const recent = transactions.slice(0, 5);

  const emailName = session?.user.email?.split('@')[0];
  const name = profile?.display_name?.trim() || emailName || '';
  const greeting = name
    ? t('home.greeting', { name })
    : t('home.greetingFallback');

  function bucketLabel(bucket: DateBucket, occurredAt: string) {
    switch (bucket) {
      case 'today':
        return t('transactions.today');
      case 'yesterday':
        return t('transactions.yesterday');
      case 'thisWeek':
        return t('transactions.thisWeek');
      case 'earlier':
        return formatDate(occurredAt, {
          day: 'numeric',
          month: 'short',
          year: undefined,
        });
    }
  }

  function rowProps(txn: Transaction) {
    const cat = categoryByKey(txn.category);
    const label = cat ? t(cat.labelKey) : txn.category;
    const when = bucketLabel(bucketFor(txn.occurred_at), txn.occurred_at);
    return {
      id: txn.id,
      icon: txn.icon,
      iconTint: (cat?.tint ?? 'accentTeal') as keyof ColorTokens,
      title: txn.title,
      subtitle: `${label} · ${when}`,
      tone: (txn.type === 'income' ? 'income' : 'expense') as
        'income' | 'expense',
      amount: `${txn.type === 'income' ? '+' : '-'}${formatCurrency(txn.amount)}`,
    };
  }

  if (txnsLoading) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.loader, { backgroundColor: theme.colors.bgApp }]}
      >
        <ActivityIndicator color={theme.colors.accentTeal} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontFamily: theme.fonts.heading.semibold,
                fontSize: 20,
                color: theme.colors.textPrimary,
              }}
            >
              {greeting}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body.regular,
                fontSize: 13,
                color: theme.colors.textSecondary,
              }}
            >
              {t('home.subtitle')}
            </Text>
          </View>
          <ButtonIconOnly
            icon="settings"
            variant="surface"
            size={40}
            accessibilityLabel={t('home.settings')}
            onPress={() => router.push('/(tabs)/ayarlar')}
          />
        </View>

        <NetDurumCard
          label={t('home.netStatus')}
          amount={formatCurrency(summary.net)}
          incomeAmount={formatCurrency(summary.income)}
          expenseAmount={formatCurrency(summary.expense)}
          incomeLabel={t('common.gelir')}
          expenseLabel={t('common.gider')}
        />

        {regularIncome > 0 ? (
          <InfoRowChevron
            icon="repeat"
            label={t('home.regularIncome')}
            value={formatCurrency(regularIncome)}
            onPress={() => {}}
          />
        ) : null}

        {upcoming ? (
          <InfoRowChevron
            icon="calendar-clock"
            label={
              upcoming.daysLeft === 0
                ? t('home.upcomingPaymentToday', {
                    name: upcoming.payment.name,
                  })
                : t('home.upcomingPayment', {
                    name: upcoming.payment.name,
                    days: upcoming.daysLeft,
                  })
            }
            value={formatCurrency(upcoming.payment.amount)}
            valueColor="expenseCoral"
            onPress={() => {}}
          />
        ) : null}

        <View style={{ gap: 14 }}>
          <SectionTitle title={t('home.categoryBreakdown')} />
          <CategoryBreakdownCard
            slices={slices}
            total={totalExpense}
            totalLabel={formatCurrency(totalExpense)}
            caption={t('home.spending')}
            emptyLabel={t('home.noData')}
          />
        </View>

        {progress.length > 0 ? (
          <View style={{ gap: 14 }}>
            <SectionTitle title={t('home.budgetTracking')} />
            {progress.map((item) => (
              <View key={item.budget.id} style={{ gap: 4 }}>
                <BudgetProgressRow
                  name={item.budget.category_name}
                  subtitle={`${formatCurrency(item.spent)} / ${formatCurrency(item.budget.limit_amount)}`}
                  subtitleColor={item.over ? 'warningRed' : 'textSecondary'}
                  progress={item.percent}
                  progressColor={item.over ? 'warningRed' : 'accentTeal'}
                />
                {item.over ? (
                  <Text
                    style={{
                      fontFamily: theme.fonts.body.semibold,
                      fontSize: 11,
                      color: theme.colors.warningRed,
                    }}
                  >
                    {t('home.overBy', {
                      amount: formatCurrency(
                        item.spent - item.budget.limit_amount,
                      ),
                    })}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          <View style={styles.sectionHeader}>
            <SectionTitle title={t('home.recentTransactions')} />
            <Pressable
              onPress={() => router.push('/(tabs)/islemler')}
              hitSlop={8}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.body.semibold,
                  fontSize: 13,
                  color: theme.colors.accentTeal,
                }}
              >
                {t('home.seeAll')}
              </Text>
            </Pressable>
          </View>
          {recent.length > 0 ? (
            recent.map((txn) => {
              const { id, ...row } = rowProps(txn);
              return <TransactionRow key={id} {...row} />;
            })
          ) : (
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 13,
                color: theme.colors.textTertiary,
              }}
            >
              {t('home.empty')}
            </Text>
          )}
        </View>
      </ScrollView>

      <View
        style={[styles.fab, { bottom: insets.bottom + 88 }]}
        pointerEvents="box-none"
      >
        <View style={elevatedShadow(theme.colors.accentTeal, 0.33, 6, 16)}>
          <ButtonIconOnly
            icon="plus"
            variant="accent"
            size={56}
            accessibilityLabel={t('home.addTransaction')}
            onPress={() => router.push('/yeni-islem')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <Text
      style={{
        fontFamily: theme.fonts.heading.semibold,
        fontSize: 16,
        color: theme.colors.textPrimary,
      }}
    >
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    flexGrow: 1,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fab: { position: 'absolute', right: 20 },
});
