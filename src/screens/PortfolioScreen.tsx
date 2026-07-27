import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { symbolFor, toCurrencyCode } from '@/lib/currency';
import { formatCurrency } from '@/lib/format';
import { holdingsByCurrency, totalInMainCurrency } from '@/lib/portfolio';
import { AlertBanner, StateView } from '@/molecules';
import { AppBarBackTitle } from '@/organisms';
import {
  useGetProfileQuery,
  useListGoalsQuery,
  useListTransactionsQuery,
  useRates,
} from '@/store/api';
import { useTheme } from '@/theme';

export function PortfolioScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: profile } = useGetProfileQuery();
  const {
    data: transactions = [],
    isLoading,
    isError,
    refetch,
  } = useListTransactionsQuery();
  const { data: goals = [] } = useListGoalsQuery();
  const { rates, stale } = useRates();

  const mainCurrency = toCurrencyCode(profile?.main_currency);

  const holdings = holdingsByCurrency([
    ...transactions.map((txn) => ({
      amount: txn.amount,
      currency: txn.currency,
      sign: (txn.type === 'income' ? 1 : -1) as 1 | -1,
    })),
    ...goals.map((goal) => ({
      amount: goal.current_amount,
      currency: goal.currency,
      sign: 1 as const,
    })),
  ]);
  const { total, excluded } = totalInMainCurrency(
    holdings,
    mainCurrency,
    rates,
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
        <AppBarBackTitle
          title={t('portfolio.title')}
          onBack={() => router.back()}
        />

        {isLoading || isError ? (
          <StateView
            variant={isLoading ? 'loading' : 'error'}
            message={isError ? t('common.connectionError') : undefined}
            onRetry={isError ? refetch : undefined}
          />
        ) : (
          <>
            {stale ? (
              <AlertBanner variant="info" message={t('portfolio.stale')} />
            ) : null}

            <View
              style={{
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.bgSurface,
                padding: theme.spacing.md,
                gap: theme.spacing.sm,
              }}
            >
              {holdings.map((holding) => (
                <View key={holding.currency} style={styles.row}>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body.medium,
                      fontSize: 14,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {t(`currency.${holding.currency}`)}
                  </Text>
                  <Text
                    style={{
                      fontFamily: theme.fonts.body.semibold,
                      fontSize: 15,
                      color:
                        holding.total < 0
                          ? theme.colors.expenseCoral
                          : theme.colors.textPrimary,
                    }}
                  >
                    {formatCurrency(holding.total, holding.currency)}
                  </Text>
                </View>
              ))}
            </View>

            <View
              style={{
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.bgSurface,
                padding: theme.spacing.md,
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.body.semibold,
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                }}
              >
                {t('portfolio.total', {
                  currency: symbolFor(mainCurrency),
                })}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.heading.bold,
                  fontSize: 26,
                  color: theme.colors.textPrimary,
                }}
              >
                {formatCurrency(total, mainCurrency)}
              </Text>
              {excluded.length ? (
                <Text
                  style={{
                    fontFamily: theme.fonts.body.medium,
                    fontSize: 12,
                    color: theme.colors.textTertiary,
                  }}
                >
                  {t('portfolio.excluded', {
                    units: excluded.map((c) => t(`currency.${c}`)).join(', '),
                  })}
                </Text>
              ) : null}
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
