import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonSecondary } from '@/atoms';
import { formatCurrency } from '@/lib/format';
import { toCurrencyCode, type CurrencyCode } from '@/lib/currency';
import { holdingsByCurrency, totalInMainCurrency } from '@/lib/portfolio';
import { StateView } from '@/molecules';
import { AppBarBackTitle, IncomeSourceCard } from '@/organisms';
import {
  useDeleteIncomeSourceMutation,
  useListIncomeSourcesQuery,
  useGetProfileQuery,
  useRates,
} from '@/store/api';
import { useTheme } from '@/theme';
import type { IncomeSource } from '@/types';

export function IncomeSourcesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const {
    data: incomeSources = [],
    isLoading,
    isError,
    refetch,
  } = useListIncomeSourcesQuery();
  const [deleteIncomeSource] = useDeleteIncomeSourceMutation();
  const { data: profile } = useGetProfileQuery();
  const { rates } = useRates();
  const mainCurrency = toCurrencyCode(profile?.main_currency);
  const monthlyTotal = totalInMainCurrency(
    holdingsByCurrency(
      incomeSources.map((s) => ({ amount: s.amount, currency: s.currency, sign: 1 as const })),
    ),
    mainCurrency,
    rates,
  ).total;

  useFocusEffect(
    useCallback(() => {
      const handle = requestIdleCallback(() => refetch());
      return () => cancelIdleCallback(handle);
    }, [refetch]),
  );

  function confirmDelete(source: IncomeSource) {
    Alert.alert(t('newIncome.deleteTitle'), t('newIncome.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          deleteIncomeSource(source.id)
            .unwrap()
            .catch(() => Alert.alert(t('newIncome.saveFailed')));
        },
      },
    ]);
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
        <View style={styles.appBar}>
          <AppBarBackTitle
            title={t('incomeSources.title')}
            onBack={() => router.back()}
          />
        </View>

        <Text
          style={{
            fontFamily: theme.fonts.body.medium,
            fontSize: 13,
            color: theme.colors.textSecondary,
          }}
        >
          {t('incomeSources.subtitle', {
            total: formatCurrency(monthlyTotal, mainCurrency),
            count: incomeSources.length,
          })}
        </Text>

        {isLoading ? (
          <StateView variant="loading" />
        ) : isError ? (
          <StateView variant="error" onRetry={refetch} />
        ) : incomeSources.length > 0 ? (
          incomeSources.map((source) => (
            <IncomeSourceCard
              key={source.id}
              name={source.name}
              amount={formatCurrency(source.amount, source.currency as CurrencyCode)}
              frequencyLabel={t(`frequency.${source.frequency}`)}
              dayLabel={
                source.pay_day != null
                  ? t('incomeSources.payDay', { day: source.pay_day })
                  : ''
              }
              onEdit={() =>
                router.push({
                  pathname: '/yeni-gelir',
                  params: { id: source.id },
                })
              }
              onDelete={() => confirmDelete(source)}
            />
          ))
        ) : (
          <StateView
            variant="empty"
            icon="wallet"
            message={t('incomeSources.empty')}
          />
        )}

        <ButtonSecondary
          tone="accent"
          icon="plus"
          label={t('incomeSources.add')}
          onPress={() => router.push('/yeni-gelir')}
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
    paddingBottom: 40,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
