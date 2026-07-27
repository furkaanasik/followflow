import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonSecondary } from '@/atoms';
import { goalPercent } from '@/lib/aggregate';
import { formatCurrency, formatDate } from '@/lib/format';
import { toCurrencyCode, type CurrencyCode } from '@/lib/currency';
import { holdingsByCurrency, totalInMainCurrency } from '@/lib/portfolio';
import { StateView, TitleSubtitle } from '@/molecules';
import { GoalCard } from '@/organisms';
import {
  useGetProfileQuery,
  useListGoalsQuery,
  useRates,
} from '@/store/api';
import { useTheme } from '@/theme';

export function GoalsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: goals = [], isLoading, isError, refetch } = useListGoalsQuery();
  const { data: profile } = useGetProfileQuery();
  const { rates } = useRates();
  const mainCurrency = toCurrencyCode(profile?.main_currency);
  const totalSaved = totalInMainCurrency(
    holdingsByCurrency(
      goals.map((g) => ({ amount: g.current_amount, currency: g.currency, sign: 1 as const })),
    ),
    mainCurrency,
    rates,
  ).total;

  // Reload when the tab regains focus instead of pull-to-refresh; deferred
  // so the tab switch renders instantly and the refetch runs after.
  useFocusEffect(
    useCallback(() => {
      const handle = requestIdleCallback(() => refetch());
      return () => cancelIdleCallback(handle);
    }, [refetch]),
  );

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
            title={t('goals.title')}
            subtitle={t('goals.subtitle', {
              count: goals.length,
              total: formatCurrency(totalSaved, mainCurrency),
            })}
          />
        </View>

        {isLoading ? (
          <StateView variant="loading" />
        ) : isError ? (
          <StateView variant="error" onRetry={refetch} />
        ) : goals.length > 0 ? (
          goals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={() => router.push(`/hedef/${goal.id}`)}
              accessibilityRole="button"
              accessibilityLabel={goal.name}
            >
              <GoalCard
                icon={goal.icon}
                name={goal.name}
                targetLabel={t('goals.target', {
                  amount: formatCurrency(goal.target_amount, goal.currency as CurrencyCode),
                })}
                percent={Math.round(goalPercent(goal))}
                percentLabel={t('goals.completed')}
                amountsLabel={`${formatCurrency(goal.current_amount, goal.currency as CurrencyCode)} / ${formatCurrency(goal.target_amount, goal.currency as CurrencyCode)}`}
                etaLabel={
                  goal.target_date
                    ? t('goals.eta', {
                        date: formatDate(goal.target_date, {
                          day: undefined,
                          month: 'long',
                          year: 'numeric',
                        }),
                      })
                    : t('goals.noEta')
                }
              />
            </Pressable>
          ))
        ) : (
          <StateView variant="empty" icon="target" message={t('goals.empty')} />
        )}

        <ButtonSecondary
          tone="accent"
          icon="plus"
          label={t('goals.addGoal')}
          onPress={() => router.push('/yeni-hedef')}
        />
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
