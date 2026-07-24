import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonSecondary } from '@/atoms';
import { goalPercent } from '@/lib/aggregate';
import { formatCurrency, formatDate } from '@/lib/format';
import { StateView, TitleSubtitle } from '@/molecules';
import { GoalCard } from '@/organisms';
import { useListGoalsQuery } from '@/store/api';
import { useTheme } from '@/theme';

export function GoalsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: goals = [], isLoading, isError, refetch } = useListGoalsQuery();
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);

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
              total: formatCurrency(totalSaved),
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
                  amount: formatCurrency(goal.target_amount),
                })}
                percent={Math.round(goalPercent(goal))}
                percentLabel={t('goals.completed')}
                amountsLabel={`${formatCurrency(goal.current_amount)} / ${formatCurrency(goal.target_amount)}`}
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
