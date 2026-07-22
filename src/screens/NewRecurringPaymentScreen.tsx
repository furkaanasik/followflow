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
import { computeNextPaymentDate } from '@/lib/onboarding';
import { AlertBanner, FormFieldGroup, SegmentedToggle } from '@/molecules';
import {
  useCreateRecurringPaymentMutation,
  useDeleteRecurringPaymentMutation,
  useListRecurringPaymentsQuery,
  useUpdateRecurringPaymentMutation,
} from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/theme';

export function NewRecurringPaymentScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const session = useAppSelector((s) => s.auth.session);

  const { data: recurringPayments = [] } = useListRecurringPaymentsQuery();
  const [createRecurringPayment, { isLoading: creating }] =
    useCreateRecurringPaymentMutation();
  const [updateRecurringPayment, { isLoading: updating }] =
    useUpdateRecurringPaymentMutation();
  const [deleteRecurringPayment, { isLoading: deleting }] =
    useDeleteRecurringPaymentMutation();
  const submitting = creating || updating || deleting;

  const existing = id ? recurringPayments.find((p) => p.id === id) : undefined;

  const [name, setName] = useState(() => existing?.name ?? '');
  const [amount, setAmount] = useState(() =>
    existing ? String(existing.amount) : '',
  );
  const [frequency, setFrequency] = useState(() =>
    existing?.frequency === 'weekly' ? 'weekly' : 'monthly',
  );
  // Parse the day straight from the YYYY-MM-DD string — new Date().getDate()
  // reads it as UTC midnight and shifts a day back in negative-offset zones.
  const [payDay, setPayDay] = useState(() =>
    existing ? String(Number(existing.next_payment_date.slice(8, 10))) : '',
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
      setNameError(t('validation.paymentNameRequired'));
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
      next_payment_date: computeNextPaymentDate(parsedPayDay),
    };
    try {
      if (existing) {
        // Omit `icon` so a custom icon set elsewhere survives the edit.
        await updateRecurringPayment({ id: existing.id, ...payload }).unwrap();
      } else {
        await createRecurringPayment({
          user_id: session!.user.id,
          icon: 'repeat',
          ...payload,
        }).unwrap();
      }
    } catch {
      setFormError(t('newRecurring.saveFailed'));
      return;
    }
    router.back();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert(
      t('newRecurring.deleteTitle'),
      t('newRecurring.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setFormError(undefined);
            deleteRecurringPayment(existing.id)
              .unwrap()
              .then(() => router.back())
              .catch(() => setFormError(t('newRecurring.saveFailed')));
          },
        },
      ],
    );
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
              {existing ? t('newRecurring.editTitle') : t('newRecurring.title')}
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
            label={t('newRecurring.nameLabel')}
            value={name}
            onChangeText={(text) => {
              setNameError(undefined);
              setName(text);
            }}
            placeholder={t('newRecurring.namePlaceholder')}
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
              label={t('newRecurring.delete')}
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
            label={
              submitting ? t('newRecurring.saving') : t('newRecurring.save')
            }
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
