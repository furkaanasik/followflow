import { useLocalSearchParams, useRouter } from 'expo-router';
import { createElement, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  ButtonIconOnly,
  ButtonPrimary,
  CategoryIcon,
  ProgressBar,
} from '@/atoms';
import {
  averageMonthlyContribution,
  goalPercent,
  goalProjectionMonths,
  monthlyContributionSeries,
} from '@/lib/aggregate';
import { formatCurrency, formatDate } from '@/lib/format';
import { getIcon } from '@/lib/icons';
import { AppBarBackTitle, GoalProgressChart } from '@/organisms';
import {
  useListGoalContributionsQuery,
  useListGoalsQuery,
  useRemoveGoalContributionMutation,
} from '@/store/api';
import { useTheme } from '@/theme';

export function GoalDetailScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: goals = [], isLoading: goalsLoading } = useListGoalsQuery();
  const { data: contribs = [] } = useListGoalContributionsQuery(id!, {
    skip: !id,
  });
  const [removeContribution] = useRemoveGoalContributionMutation();

  const goal = goals.find((g) => g.id === id);

  function confirmRemoveContribution(contributionId: string) {
    Alert.alert(
      t('goalDetail.removeContributionTitle'),
      t('goalDetail.removeContributionMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('goalDetail.removeContribution'),
          style: 'destructive',
          onPress: () => {
            removeContribution(contributionId)
              .unwrap()
              .catch(() => {
                Alert.alert(t('goalDetail.removeContributionFailed'));
              });
          },
        },
      ],
    );
  }

  // Deleted from the edit sheet (or bad deep link): pop back to the list
  // instead of stranding the user on the not-found fallback.
  const missing = !goalsLoading && !goal;
  useEffect(() => {
    if (missing && router.canGoBack()) router.back();
  }, [missing, router]);

  if (!goal) {
    return (
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.loader, { backgroundColor: theme.colors.bgApp }]}
      >
        {goalsLoading ? (
          <ActivityIndicator color={theme.colors.accentTeal} />
        ) : (
          <Text
            style={{
              fontFamily: theme.fonts.body.medium,
              fontSize: 13,
              color: theme.colors.textTertiary,
            }}
          >
            {t('goalDetail.notFound')}
          </Text>
        )}
      </SafeAreaView>
    );
  }

  const percent = goalPercent(goal);
  const reached = goal.current_amount >= goal.target_amount;
  const rate = averageMonthlyContribution(contribs);
  const remaining = Math.max(0, goal.target_amount - goal.current_amount);
  const months = goalProjectionMonths(remaining, rate);

  const bars = monthlyContributionSeries(contribs).map((m) => ({
    label: formatDate(new Date(m.year, m.monthIndex, 1), {
      day: undefined,
      month: 'short',
      year: undefined,
    }),
    value: m.total,
    current: m.current,
  }));

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appBar}>
          <AppBarBackTitle
            title={t('goalDetail.title')}
            onBack={() => router.back()}
          />
          <ButtonIconOnly
            icon="pencil"
            variant="surface"
            size={36}
            accessibilityLabel={t('goalDetail.edit')}
            onPress={() =>
              router.push({ pathname: '/yeni-hedef', params: { id } })
            }
          />
        </View>

        <View style={styles.hero}>
          <CategoryIcon icon={goal.icon} size={56} />
          <View style={{ gap: 2 }}>
            <Text
              style={{
                fontFamily: theme.fonts.heading.bold,
                fontSize: 20,
                color: theme.colors.textPrimary,
              }}
            >
              {goal.name}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 13,
                color: theme.colors.accentTeal,
              }}
            >
              {t('goalDetail.completedPct', { pct: Math.round(percent) })}
            </Text>
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <View style={styles.amountsRow}>
            <View style={{ gap: 2 }}>
              <Text
                style={{
                  fontFamily: theme.fonts.body.regular,
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                }}
              >
                {t('goalDetail.saved')}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.heading.bold,
                  fontSize: 28,
                  color: theme.colors.accentTeal,
                }}
              >
                {formatCurrency(goal.current_amount)}
              </Text>
            </View>
            <View style={{ gap: 2, alignItems: 'flex-end' }}>
              <Text
                style={{
                  fontFamily: theme.fonts.body.regular,
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                }}
              >
                {t('goalDetail.target')}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.heading.semibold,
                  fontSize: 18,
                  color: theme.colors.textPrimary,
                }}
              >
                {formatCurrency(goal.target_amount)}
              </Text>
            </View>
          </View>
          <ProgressBar value={percent} />
        </View>

        <GoalProgressChart
          title={t('goalDetail.monthlyProgress')}
          bars={bars}
          emptyLabel={t('goalDetail.chartEmpty')}
        />

        {contribs.length > 0 ? (
          <View
            style={{
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.bgSurface,
              padding: theme.spacing.md,
              gap: theme.spacing.sm,
            }}
          >
            <Text
              style={{
                fontFamily: theme.fonts.heading.semibold,
                fontSize: 14,
                color: theme.colors.textPrimary,
              }}
            >
              {t('goalDetail.contributions')}
            </Text>
            {[...contribs].reverse().map((contribution) => (
              <View key={contribution.id} style={styles.contributionRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body.semibold,
                      fontSize: 14,
                      color: theme.colors.textPrimary,
                    }}
                  >
                    {formatCurrency(contribution.amount)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body.regular,
                      fontSize: 12,
                      color: theme.colors.textTertiary,
                    }}
                  >
                    {formatDate(contribution.occurred_at, {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {contribution.note ? ` · ${contribution.note}` : ''}
                  </Text>
                </View>
                <ButtonIconOnly
                  icon="trash-2"
                  variant="surface"
                  size={32}
                  iconColor="expenseCoral"
                  accessibilityLabel={t('goalDetail.removeContribution')}
                  onPress={() => confirmRemoveContribution(contribution.id)}
                />
              </View>
            ))}
          </View>
        ) : null}

        {reached ? (
          <View
            style={[
              styles.infoRow,
              {
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.accentTealDim,
              },
            ]}
          >
            {createElement(getIcon('party-popper'), {
              size: 16,
              color: theme.colors.accentTeal,
            })}
            <Text
              style={{
                flex: 1,
                fontFamily: theme.fonts.body.semibold,
                fontSize: 13,
                color: theme.colors.accentTeal,
              }}
            >
              {t('goalDetail.reached')}
            </Text>
          </View>
        ) : months != null ? (
          <View style={{ gap: theme.spacing.xs }}>
            <View
              style={[
                styles.infoRow,
                {
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.accentTealDim,
                },
              ]}
            >
              {createElement(getIcon('trending-up'), {
                size: 16,
                color: theme.colors.accentTeal,
              })}
              <Text
                style={{
                  flex: 1,
                  fontFamily: theme.fonts.body.semibold,
                  fontSize: 13,
                  color: theme.colors.accentTeal,
                }}
              >
                {t('goalDetail.projection', { months })}
              </Text>
            </View>
            <View
              style={[
                styles.infoRow,
                {
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.bgSurfaceAlt,
                },
              ]}
            >
              {createElement(getIcon('calendar-check'), {
                size: 16,
                color: theme.colors.textTertiary,
              })}
              <Text
                style={{
                  flex: 1,
                  fontFamily: theme.fonts.body.medium,
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                }}
              >
                {t('goalDetail.assumption', {
                  amount: formatCurrency(rate),
                })}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <ButtonPrimary
          icon="plus"
          label={t('goalDetail.addMoney')}
          onPress={() =>
            router.push({ pathname: '/hedef-para-ekle', params: { id } })
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    flexGrow: 1,
    paddingTop: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  amountsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
});
