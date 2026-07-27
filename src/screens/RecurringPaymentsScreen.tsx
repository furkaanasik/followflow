import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonSecondary } from '@/atoms';
import { formatCurrency, formatDate } from '@/lib/format';
import { toCurrencyCode, type CurrencyCode } from '@/lib/currency';
import { holdingsByCurrency, totalInMainCurrency } from '@/lib/portfolio';
import { StateView } from '@/molecules';
import { AppBarBackTitle, RecurringPaymentCard } from '@/organisms';
import {
  useDeleteRecurringPaymentMutation,
  useListRecurringPaymentsQuery,
  useGetProfileQuery,
  useRates,
} from '@/store/api';
import { useTheme } from '@/theme';
import type { RecurringPayment } from '@/types';

export function RecurringPaymentsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const {
    data: recurringPayments = [],
    isLoading,
    isError,
    refetch,
  } = useListRecurringPaymentsQuery();
  const [deleteRecurringPayment] = useDeleteRecurringPaymentMutation();
  const { data: profile } = useGetProfileQuery();
  const { rates } = useRates();
  const mainCurrency = toCurrencyCode(profile?.main_currency);
  const monthlyTotal = totalInMainCurrency(
    holdingsByCurrency(
      recurringPayments.map((p) => ({ amount: p.amount, currency: p.currency, sign: 1 as const })),
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

  function confirmDelete(payment: RecurringPayment) {
    Alert.alert(
      t('newRecurring.deleteTitle'),
      t('newRecurring.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteRecurringPayment(payment.id)
              .unwrap()
              .catch(() => Alert.alert(t('newRecurring.saveFailed')));
          },
        },
      ],
    );
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
            title={t('recurringPayments.title')}
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
          {t('recurringPayments.subtitle', {
            total: formatCurrency(monthlyTotal, mainCurrency),
            count: recurringPayments.length,
          })}
        </Text>

        {isLoading ? (
          <StateView variant="loading" />
        ) : isError ? (
          <StateView variant="error" onRetry={refetch} />
        ) : recurringPayments.length > 0 ? (
          recurringPayments.map((payment) => (
            <RecurringPaymentCard
              key={payment.id}
              icon={payment.icon}
              name={payment.name}
              amount={formatCurrency(payment.amount, payment.currency as CurrencyCode)}
              frequencyLabel={t(`frequency.${payment.frequency}`)}
              nextLabel={t('recurringPayments.next', {
                date: formatDate(payment.next_payment_date, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }),
              })}
              onEdit={() =>
                router.push({
                  pathname: '/yeni-tekrarlayan',
                  params: { id: payment.id },
                })
              }
              onDelete={() => confirmDelete(payment)}
            />
          ))
        ) : (
          <StateView
            variant="empty"
            icon="repeat"
            message={t('recurringPayments.empty')}
          />
        )}

        <ButtonSecondary
          tone="accent"
          icon="plus"
          label={t('recurringPayments.add')}
          onPress={() => router.push('/yeni-tekrarlayan')}
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
