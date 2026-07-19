import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ButtonPrimary, SurfaceCard } from '@/atoms';
import {
  AlertBanner,
  FormFieldGroup,
  SegmentedToggle,
  StepBadge,
  TitleSubtitle,
} from '@/molecules';
import { OnboardingTopBar } from '@/organisms';
import { computeNextPaymentDate } from '@/lib/onboarding';
import { useCreateRecurringPaymentMutation } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateRecurringDraft } from '@/store/slices/onboardingSlice';
import { useTheme } from '@/theme';

export function OnboardingRecurringPaymentScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);
  const draft = useAppSelector((s) => s.onboarding.recurringDraft);
  const [createRecurringPayment, { isLoading: submitting }] =
    useCreateRecurringPaymentMutation();

  const [nameError, setNameError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [payDayError, setPayDayError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const frequencyOptions = [
    { label: t('onboarding.monthly'), value: 'monthly' },
    { label: t('onboarding.weekly'), value: 'weekly' },
  ];

  function handleBack() {
    router.push({
      pathname: '/(onboarding)/income',
      params: { back: '1' },
    });
  }

  function handleSkip() {
    router.push('/(onboarding)/goal');
  }

  async function handleSave() {
    setNameError(undefined);
    setAmountError(undefined);
    setPayDayError(undefined);
    setFormError(undefined);

    let valid = true;
    if (!draft.name.trim()) {
      setNameError(t('validation.paymentNameRequired'));
      valid = false;
    }
    const parsedAmount = Number(draft.amount.replace(',', '.'));
    if (
      !draft.amount.trim() ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setAmountError(t('validation.amountInvalid'));
      valid = false;
    }
    const parsedPayDay = Number(draft.payDay);
    if (
      !draft.payDay.trim() ||
      !Number.isInteger(parsedPayDay) ||
      parsedPayDay < 1 ||
      parsedPayDay > 31
    ) {
      setPayDayError(t('validation.payDayInvalid'));
      valid = false;
    }
    if (!valid) return;

    try {
      await createRecurringPayment({
        user_id: session!.user.id,
        icon: 'repeat',
        name: draft.name,
        amount: parsedAmount,
        frequency: draft.frequency as 'monthly' | 'weekly',
        next_payment_date: computeNextPaymentDate(parsedPayDay),
      }).unwrap();
    } catch {
      setFormError(t('onboarding.saveFailed'));
      return;
    }
    router.push('/(onboarding)/goal');
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            { gap: theme.spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <OnboardingTopBar step={2} onBack={handleBack} onSkip={handleSkip} />

          <View style={{ gap: theme.spacing.sm }}>
            <StepBadge
              icon="repeat"
              label={t('onboarding.step', { current: 2, total: 3 })}
            />
            <TitleSubtitle
              title={t('onboarding.recurring.title')}
              subtitle={t('onboarding.recurring.subtitle')}
            />
          </View>

          <SurfaceCard>
            {formError ? <AlertBanner message={formError} /> : null}

            <FormFieldGroup
              label={t('onboarding.recurring.nameLabel')}
              value={draft.name}
              onChangeText={(name) => dispatch(updateRecurringDraft({ name }))}
              placeholder={t('onboarding.recurring.namePlaceholder')}
              icon="tag"
              error={nameError}
            />
            <FormFieldGroup
              label={t('onboarding.amountLabel')}
              value={draft.amount}
              onChangeText={(amount) =>
                dispatch(updateRecurringDraft({ amount }))
              }
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
                value={draft.frequency}
                onChange={(frequency) =>
                  dispatch(updateRecurringDraft({ frequency }))
                }
              />
            </View>

            <FormFieldGroup
              label={t('onboarding.payDayLabel')}
              value={draft.payDay}
              onChangeText={(payDay) =>
                dispatch(updateRecurringDraft({ payDay }))
              }
              placeholder={t('onboarding.payDayPlaceholder')}
              icon="calendar"
              keyboardType="number-pad"
              error={payDayError}
            />

            <ButtonPrimary
              label={
                submitting
                  ? t('onboarding.saving')
                  : t('onboarding.saveContinue')
              }
              onPress={handleSave}
              disabled={submitting}
            />
          </SurfaceCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});
