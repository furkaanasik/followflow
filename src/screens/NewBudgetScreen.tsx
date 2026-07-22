import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AmountDisplay,
  ButtonIconOnly,
  ButtonPrimary,
  ButtonSecondary,
} from '@/atoms';
import { currentPeriodMonth } from '@/lib/aggregate';
import {
  formatAmountInput,
  nextAmountRaw,
  NUMPAD_ROWS,
} from '@/lib/amountInput';
import { categoriesByType, categoryByKey } from '@/lib/categories';
import { parseAmount } from '@/lib/format';
import { AlertBanner, CategoryChip, NumpadKeyRow } from '@/molecules';
import {
  useCreateBudgetMutation,
  useDeleteBudgetMutation,
  useListBudgetsQuery,
  useUpdateBudgetMutation,
} from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';

export function NewBudgetScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = useAppSelector((s) => s.auth.session);

  const { data: budgets = [] } = useListBudgetsQuery(currentPeriodMonth());
  const [createBudget, { isLoading: creating }] = useCreateBudgetMutation();
  const [updateBudget, { isLoading: updating }] = useUpdateBudgetMutation();
  const [deleteBudget, { isLoading: deleting }] = useDeleteBudgetMutation();
  const submitting = creating || updating || deleting;

  const existing = id ? budgets.find((b) => b.id === id) : undefined;

  const [categoryKey, setCategoryKey] = useState(() =>
    existing && categoryByKey(existing.category_name)
      ? existing.category_name
      : categoriesByType('expense')[0].key,
  );
  const [amountRaw, setAmountRaw] = useState(() =>
    existing ? String(existing.limit_amount) : '',
  );
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const categories = categoriesByType('expense');

  function handleKey(key: string) {
    setFieldError(undefined);
    setAmountRaw((prev) => nextAmountRaw(prev, key));
  }

  async function handleSave() {
    setFieldError(undefined);
    setFormError(undefined);

    const amount = parseAmount(amountRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFieldError(t('validation.amountRequired'));
      return;
    }
    const category = categoryByKey(categoryKey);
    if (!category) {
      setFieldError(t('validation.categoryRequired'));
      return;
    }

    const payload = {
      icon: category.icon,
      category_name: category.key,
      limit_amount: amount,
      period_month: currentPeriodMonth(),
    };
    try {
      if (existing) {
        await updateBudget({ id: existing.id, ...payload }).unwrap();
      } else {
        await createBudget({ user_id: session!.user.id, ...payload }).unwrap();
      }
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        setFormError(t('newBudget.duplicate'));
      } else {
        setFormError(t('newBudget.saveFailed'));
      }
      return;
    }
    router.back();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert(t('newBudget.deleteTitle'), t('newBudget.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setFormError(undefined);
          deleteBudget(existing.id)
            .unwrap()
            .then(() => router.back())
            .catch(() => setFormError(t('newBudget.saveFailed')));
        },
      },
    ]);
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.bgSurface }]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { gap: 10 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={{
              fontFamily: theme.fonts.heading.bold,
              fontSize: 20,
              color: theme.colors.textPrimary,
            }}
          >
            {existing ? t('newBudget.editTitle') : t('newBudget.title')}
          </Text>
          <ButtonIconOnly
            icon="x"
            variant="surface"
            size={40}
            accessibilityLabel={t('newTransaction.close')}
            onPress={() => router.back()}
          />
        </View>

        {formError ? <AlertBanner message={formError} /> : null}

        <View style={{ gap: theme.spacing.xs }}>
          <Text
            style={{
              fontFamily: theme.fonts.body.semibold,
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}
          >
            {t('newBudget.categoryLabel')}
          </Text>
          <View style={styles.chips}>
            {categories.map((cat) => (
              <CategoryChip
                key={cat.key}
                icon={cat.icon}
                label={t(cat.labelKey)}
                tint={cat.tint}
                selected={cat.key === categoryKey}
                onPress={() => setCategoryKey(cat.key)}
              />
            ))}
          </View>
        </View>

        <View style={styles.amountArea}>
          <Text
            style={{
              fontFamily: theme.fonts.body.semibold,
              fontSize: 12,
              color: theme.colors.textSecondary,
              textAlign: 'center',
            }}
          >
            {t('newBudget.limitLabel')}
          </Text>
          <AmountDisplay amount={formatAmountInput(amountRaw)} />
          {fieldError ? (
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 12,
                color: theme.colors.warningRed,
                textAlign: 'center',
              }}
            >
              {fieldError}
            </Text>
          ) : null}
        </View>

        {existing ? (
          <ButtonSecondary
            tone="destructive"
            icon="trash-2"
            label={t('newBudget.delete')}
            onPress={confirmDelete}
          />
        ) : null}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
      >
        <View style={styles.numpad}>
          {NUMPAD_ROWS.map((row) => (
            <NumpadKeyRow
              key={row.join('')}
              keys={row}
              onKeyPress={handleKey}
            />
          ))}
        </View>
        <ButtonPrimary
          label={submitting ? t('newBudget.saving') : t('newBudget.save')}
          onPress={handleSave}
          disabled={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  amountArea: {
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  numpad: { gap: 2, alignSelf: 'center', width: 280 },
});
