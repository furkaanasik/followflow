import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AmountDisplay,
  ButtonIconOnly,
  ButtonPrimary,
  InputField,
} from '@/atoms';
import {
  formatAmountInput,
  nextAmountRaw,
  NUMPAD_ROWS,
} from '@/lib/amountInput';
import { formatCurrency, parseAmount } from '@/lib/format';
import { AlertBanner, NumpadKeyRow } from '@/molecules';
import { useDepositToGoalMutation, useListGoalsQuery } from '@/store/api';
import { useTheme } from '@/theme';

export function GoalDepositScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: goals = [] } = useListGoalsQuery();
  const goal = goals.find((g) => g.id === id);
  const [deposit, { isLoading: submitting }] = useDepositToGoalMutation();

  const [amountRaw, setAmountRaw] = useState('');
  const [note, setNote] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const remaining = goal
    ? Math.max(0, goal.target_amount - goal.current_amount)
    : 0;

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

    const trimmedNote = note.trim();
    try {
      await deposit({
        goal_id: id!,
        amount,
        note: trimmedNote || null,
      }).unwrap();
    } catch {
      setFormError(t('goalDeposit.saveFailed'));
      return;
    }
    router.back();
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.bgSurface }]}
    >
      <View style={[styles.content, { gap: 10 }]}>
        <View style={styles.header}>
          <View style={{ gap: 2, flex: 1 }}>
            <Text
              style={{
                fontFamily: theme.fonts.heading.bold,
                fontSize: 20,
                color: theme.colors.textPrimary,
              }}
            >
              {t('goalDeposit.title')}
            </Text>
            {goal ? (
              <Text
                style={{
                  fontFamily: theme.fonts.body.regular,
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                }}
              >
                {t('goalDeposit.subtitle', {
                  name: goal.name,
                  remaining: formatCurrency(remaining),
                })}
              </Text>
            ) : null}
          </View>
          <ButtonIconOnly
            icon="x"
            variant="surface"
            size={40}
            accessibilityLabel={t('newTransaction.close')}
            onPress={() => router.back()}
          />
        </View>

        {formError ? <AlertBanner message={formError} /> : null}

        <View style={styles.amountArea}>
          <AmountDisplay amount={formatAmountInput(amountRaw)} tone="income" />
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

        <InputField
          value={note}
          onChangeText={setNote}
          placeholder={t('goalDeposit.notePlaceholder')}
          icon="pencil"
        />
      </View>

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
          label={submitting ? t('goalDeposit.saving') : t('goalDeposit.save')}
          onPress={handleSave}
          disabled={submitting}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  amountArea: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  numpad: { gap: 2, alignSelf: 'center', width: 280 },
});
