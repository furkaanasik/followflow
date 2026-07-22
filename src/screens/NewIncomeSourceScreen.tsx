import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ButtonIconOnly, ButtonPrimary, ButtonSecondary } from '@/atoms';
import { AlertBanner, FormFieldGroup, SegmentedToggle } from '@/molecules';
import {
  useCreateIncomeSourceMutation,
  useDeleteIncomeSourceMutation,
  useListIncomeSourcesQuery,
  useUpdateIncomeSourceMutation,
} from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';

export function NewIncomeSourceScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = useAppSelector((s) => s.auth.session);

  const { data: incomeSources = [] } = useListIncomeSourcesQuery();
  const [createIncomeSource, { isLoading: creating }] =
    useCreateIncomeSourceMutation();
  const [updateIncomeSource, { isLoading: updating }] =
    useUpdateIncomeSourceMutation();
  const [deleteIncomeSource, { isLoading: deleting }] =
    useDeleteIncomeSourceMutation();
  const submitting = creating || updating || deleting;

  const existing = id ? incomeSources.find((s) => s.id === id) : undefined;

  const [name, setName] = useState(() => existing?.name ?? '');
  const [amount, setAmount] = useState(() =>
    existing ? String(existing.amount) : '',
  );
  const [frequency, setFrequency] = useState(() =>
    existing?.frequency === 'weekly' ? 'weekly' : 'monthly',
  );
  const [payDay, setPayDay] = useState(() =>
    existing?.pay_day != null ? String(existing.pay_day) : '',
  );
  const [nameError, setNameError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [payDayError, setPayDayError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const frequencyOptions = [
    { label: t('onboarding.monthly'), value: 'monthly' },
    { label: t('onboarding.weekly'), value: 'weekly' },
  ];

  async function handleSave() {
    setNameError(undefined);
    setAmountError(undefined);
    setPayDayError(undefined);
    setFormError(undefined);

    let valid = true;
    if (!name.trim()) {
      setNameError(t('validation.incomeNameRequired'));
      valid = false;
    }
    const parsedAmount = Number(amount.replace(',', '.'));
    if (!amount.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError(t('validation.amountInvalid'));
      valid = false;
    }
    const parsedPayDay = Number(payDay);
    if (
      !payDay.trim() ||
      !Number.isInteger(parsedPayDay) ||
      parsedPayDay < 1 ||
      parsedPayDay > 31
    ) {
      setPayDayError(t('validation.payDayInvalid'));
      valid = false;
    }
    if (!valid) return;

    const payload = {
      name: name.trim(),
      amount: parsedAmount,
      frequency: frequency as 'monthly' | 'weekly',
      pay_day: parsedPayDay,
    };
    try {
      if (existing) {
        await updateIncomeSource({ id: existing.id, ...payload }).unwrap();
      } else {
        await createIncomeSource({
          user_id: session!.user.id,
          ...payload,
        }).unwrap();
      }
    } catch {
      setFormError(t('newIncome.saveFailed'));
      return;
    }
    router.back();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert(t('newIncome.deleteTitle'), t('newIncome.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          setFormError(undefined);
          deleteIncomeSource(existing.id)
            .unwrap()
            .then(() => router.back())
            .catch(() => setFormError(t('newIncome.saveFailed')));
        },
      },
    ]);
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.bgSurface }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { gap: theme.spacing.md }]}
          keyboardShouldPersistTaps="handled"
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
              {existing ? t('newIncome.editTitle') : t('newIncome.title')}
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

          <FormFieldGroup
            label={t('newIncome.nameLabel')}
            value={name}
            onChangeText={(text) => {
              setNameError(undefined);
              setName(text);
            }}
            placeholder={t('newIncome.namePlaceholder')}
            icon="tag"
            error={nameError}
          />

          <FormFieldGroup
            label={t('onboarding.amountLabel')}
            value={amount}
            onChangeText={(text) => {
              setAmountError(undefined);
              setAmount(text);
            }}
            placeholder={t('onboarding.amountPlaceholder')}
            icon="banknote"
            keyboardType="decimal-pad"
            error={amountError}
          />

          <View style={{ gap: theme.spacing.xs }}>
            <Text
              style={{
                fontFamily: theme.fonts.body.semibold,
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}
            >
              {t('onboarding.frequencyLabel')}
            </Text>
            <SegmentedToggle
              options={frequencyOptions}
              value={frequency}
              onChange={setFrequency}
            />
          </View>

          <FormFieldGroup
            label={t('onboarding.payDayLabel')}
            value={payDay}
            onChangeText={(text) => {
              setPayDayError(undefined);
              setPayDay(text);
            }}
            placeholder={t('onboarding.payDayPlaceholder')}
            icon="calendar"
            keyboardType="number-pad"
            error={payDayError}
          />

          {existing ? (
            <ButtonSecondary
              tone="destructive"
              icon="trash-2"
              label={t('newIncome.delete')}
              onPress={confirmDelete}
            />
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <ButtonPrimary
            label={submitting ? t('newIncome.saving') : t('newIncome.save')}
            onPress={handleSave}
            disabled={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  footer: { paddingHorizontal: 24, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
