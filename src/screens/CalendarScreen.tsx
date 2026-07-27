import { useFocusEffect, useRouter } from 'expo-router';
import { createElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { calendarMonth, eventsForDay } from '@/lib/calendar';
import { formatCurrency, formatDate } from '@/lib/format';
import { type CurrencyCode } from '@/lib/currency';
import { getIcon } from '@/lib/icons';
import { StateView } from '@/molecules';
import { AppBarBackTitle, CalendarMonthCard, CashFlowStrip } from '@/organisms';
import {
  useListIncomeSourcesQuery,
  useListRecurringPaymentsQuery,
  useListTransactionsQuery,
} from '@/store/api';
import { useTheme } from '@/theme';

export function CalendarScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(null);

  const recurringQuery = useListRecurringPaymentsQuery();
  const incomeQuery = useListIncomeSourcesQuery();
  const txnsQuery = useListTransactionsQuery();

  const isLoading =
    recurringQuery.isLoading || incomeQuery.isLoading || txnsQuery.isLoading;
  const isError =
    recurringQuery.isError || incomeQuery.isError || txnsQuery.isError;

  const refetchRecurring = recurringQuery.refetch;
  const refetchIncome = incomeQuery.refetch;
  const refetchTxns = txnsQuery.refetch;
  const refetchAll = useCallback(() => {
    refetchRecurring();
    refetchIncome();
    refetchTxns();
  }, [refetchRecurring, refetchIncome, refetchTxns]);

  useFocusEffect(
    useCallback(() => {
      const handle = requestIdleCallback(() => refetchAll());
      return () => cancelIdleCallback(handle);
    }, [refetchAll]),
  );

  const { days, events } = useMemo(
    () =>
      calendarMonth({
        recurring: recurringQuery.data ?? [],
        income: incomeQuery.data ?? [],
        txns: txnsQuery.data ?? [],
        year: cursor.year,
        month: cursor.month,
      }),
    [recurringQuery.data, incomeQuery.data, txnsQuery.data, cursor],
  );

  const monthLabel = formatDate(new Date(cursor.year, cursor.month, 1), {
    day: undefined,
    month: 'long',
    year: 'numeric',
  });
  const weekdayLabels = t('calendar.weekdays', {
    returnObjects: true,
  }) as string[];

  const cashFlowValues = useMemo(
    () =>
      days
        .filter((day) => day.inMonth)
        .map((day) => ({ day: day.day, net: day.net })),
    [days],
  );

  const selectedEvents = selected ? eventsForDay(events, selected) : [];

  function stepMonth(delta: -1 | 1) {
    setCursor((prev) => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelected(null);
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
            title={t('calendar.title')}
            onBack={() => router.back()}
          />
        </View>

        {isLoading ? (
          <StateView variant="loading" />
        ) : isError ? (
          <StateView variant="error" onRetry={refetchAll} />
        ) : (
          <>
            <CalendarMonthCard
              monthLabel={monthLabel}
              weekdayLabels={weekdayLabels}
              days={days}
              selectedDate={selected}
              onPrevMonth={() => stepMonth(-1)}
              onNextMonth={() => stepMonth(1)}
              onSelectDay={setSelected}
            />

            <CashFlowStrip
              title={t('calendar.cashFlow')}
              values={cashFlowValues}
              emptyLabel={t('calendar.empty')}
            />

            {selected ? (
              <View style={{ gap: theme.spacing.sm }}>
                <Text
                  style={{
                    fontFamily: theme.fonts.heading.semibold,
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {formatDate(selected, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                {selectedEvents.length > 0 ? (
                  selectedEvents.map((event, index) => (
                    <View
                      key={`${event.kind}-${event.label}-${index}`}
                      style={[
                        styles.eventRow,
                        {
                          borderRadius: theme.radius.sm,
                          backgroundColor: theme.colors.bgSurface,
                          padding: theme.spacing.sm,
                          gap: theme.spacing.sm,
                        },
                      ]}
                    >
                      {createElement(getIcon(event.icon), {
                        size: 18,
                        color: theme.colors.textSecondary,
                      })}
                      <Text
                        style={{
                          flex: 1,
                          fontFamily: theme.fonts.body.medium,
                          fontSize: 14,
                          color: theme.colors.textPrimary,
                        }}
                      >
                        {event.label}
                      </Text>
                      <Text
                        style={{
                          fontFamily: theme.fonts.body.semibold,
                          fontSize: 14,
                          color:
                            event.kind === 'payday'
                              ? theme.colors.incomeGreen
                              : event.sign > 0
                                ? theme.colors.incomeGreen
                                : theme.colors.expenseCoral,
                        }}
                      >
                        {event.kind === 'payday'
                          ? t('calendar.payDay')
                          : `${event.sign > 0 ? '+' : '-'}${formatCurrency(event.amount, event.currency as CurrencyCode)}`}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text
                    style={{
                      fontFamily: theme.fonts.body.medium,
                      fontSize: 13,
                      color: theme.colors.textTertiary,
                    }}
                  >
                    {t('calendar.empty')}
                  </Text>
                )}
              </View>
            ) : (
              <Text
                style={{
                  fontFamily: theme.fonts.body.medium,
                  fontSize: 13,
                  color: theme.colors.textTertiary,
                  textAlign: 'center',
                }}
              >
                {t('calendar.selectHint')}
              </Text>
            )}
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
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
