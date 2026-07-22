import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonSecondary } from '@/atoms';
import { formatCurrency } from '@/lib/format';
import { AppBarBackTitle, IncomeSourceCard } from '@/organisms';
import {
  useDeleteIncomeSourceMutation,
  useListIncomeSourcesQuery,
} from '@/store/api';
import { useTheme } from '@/theme';
import type { IncomeSource } from '@/types';

export function IncomeSourcesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  const { data: incomeSources = [], refetch } = useListIncomeSourcesQuery();
  const [deleteIncomeSource] = useDeleteIncomeSourceMutation();
  const monthlyTotal = incomeSources.reduce((sum, s) => sum + s.amount, 0);

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
            total: formatCurrency(monthlyTotal),
            count: incomeSources.length,
          })}
        </Text>

        {incomeSources.length > 0 ? (
          incomeSources.map((source) => (
            <IncomeSourceCard
              key={source.id}
              name={source.name}
              amount={formatCurrency(source.amount)}
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
          <Text
            style={{
              fontFamily: theme.fonts.body.medium,
              fontSize: 13,
              color: theme.colors.textTertiary,
              paddingTop: theme.spacing.lg,
            }}
          >
            {t('incomeSources.empty')}
          </Text>
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
