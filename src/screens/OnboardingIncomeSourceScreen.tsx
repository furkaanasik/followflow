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
import { useCreateIncomeSourceMutation } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateIncomeDraft } from '@/store/slices/onboardingSlice';
import { useTheme } from '@/theme';

export function OnboardingIncomeSourceScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);
  const draft = useAppSelector((s) => s.onboarding.incomeDraft);
  const [createIncomeSource, { isLoading: submitting }] =
    useCreateIncomeSourceMutation();

  const [nameError, setNameError] = useState<string | undefined>();
  const [amountError, setAmountError] = useState<string | undefined>();
  const [payDayError, setPayDayError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | undefined>();

  const frequencyOptions = [
    { label: t('onboarding.monthly'), value: 'monthly' },
    { label: t('onboarding.weekly'), value: 'weekly' },
  ];

  function handleSkip() {
    router.push('/(onboarding)/recurring');
  }

  async function handleSave() {
    setNameError(undefined);
    setAmountError(undefined);
    setPayDayError(undefined);
    setFormError(undefined);

    let valid = true;
    if (!draft.name.trim()) {
      setNameError(t('validation.incomeNameRequired'));
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
      await createIncomeSource({
        user_id: session!.user.id,
        name: draft.name,
        amount: parsedAmount,
        frequency: draft.frequency as 'monthly' | 'weekly',
        pay_day: parsedPayDay,
      }).unwrap();
    } catch {
      setFormError(t('onboarding.saveFailed'));
      return;
    }
    router.push('/(onboarding)/recurring');
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
          <OnboardingTopBar step={1} onSkip={handleSkip} />

          <View style={{ gap: theme.spacing.sm }}>
            <StepBadge
              icon="wallet"
              label={t('onboarding.step', { current: 1, total: 3 })}
            />
            <TitleSubtitle
              title={t('onboarding.income.title')}
              subtitle={t('onboarding.income.subtitle')}
            />
          </View>

          <SurfaceCard>
            {formError ? <AlertBanner message={formError} /> : null}

            <FormFieldGroup
              label={t('onboarding.income.nameLabel')}
              value={draft.name}
              onChangeText={(name) => dispatch(updateIncomeDraft({ name }))}
              placeholder={t('onboarding.income.namePlaceholder')}
              icon="tag"
              error={nameError}
            />
            <FormFieldGroup
              label={t('onboarding.amountLabel')}
              value={draft.amount}
              onChangeText={(amount) => dispatch(updateIncomeDraft({ amount }))}
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
                  dispatch(updateIncomeDraft({ frequency }))
                }
              />
            </View>

            <FormFieldGroup
              label={t('onboarding.payDayLabel')}
              value={draft.payDay}
              onChangeText={(payDay) => dispatch(updateIncomeDraft({ payDay }))}
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
