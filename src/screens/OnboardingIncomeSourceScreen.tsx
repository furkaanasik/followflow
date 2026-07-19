import { useState } from 'react';
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

const FREQUENCY_OPTIONS = [
  { label: 'Aylık', value: 'monthly' },
  { label: 'Haftalık', value: 'weekly' },
];

export function OnboardingIncomeSourceScreen() {
  const theme = useTheme();
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
      setNameError('Gelir adı gerekli.');
      valid = false;
    }
    const parsedAmount = Number(draft.amount.replace(',', '.'));
    if (
      !draft.amount.trim() ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setAmountError('Geçerli bir tutar gir.');
      valid = false;
    }
    const parsedPayDay = Number(draft.payDay);
    if (
      !draft.payDay.trim() ||
      !Number.isInteger(parsedPayDay) ||
      parsedPayDay < 1 ||
      parsedPayDay > 31
    ) {
      setPayDayError('Geçerli bir gün gir (1-31).');
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
      setFormError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
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
            <StepBadge icon="wallet" label="ADIM 1/3" />
            <TitleSubtitle
              title="Gelir Kaynağını Ekle"
              subtitle="Düzenli gelirini ekleyerek tahminlerini daha doğru hale getirelim."
            />
          </View>

          <SurfaceCard>
            {formError ? <AlertBanner message={formError} /> : null}

            <FormFieldGroup
              label="Gelir Adı"
              value={draft.name}
              onChangeText={(name) => dispatch(updateIncomeDraft({ name }))}
              placeholder="örn. Maaş"
              icon="tag"
              error={nameError}
            />
            <FormFieldGroup
              label="Tutar"
              value={draft.amount}
              onChangeText={(amount) => dispatch(updateIncomeDraft({ amount }))}
              placeholder="₺0,00"
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
                Tekrar Sıklığı
              </Text>
              <SegmentedToggle
                options={FREQUENCY_OPTIONS}
                value={draft.frequency}
                onChange={(frequency) =>
                  dispatch(updateIncomeDraft({ frequency }))
                }
              />
            </View>

            <FormFieldGroup
              label="Ödeme Günü (ayın kaçı)"
              value={draft.payDay}
              onChangeText={(payDay) => dispatch(updateIncomeDraft({ payDay }))}
              placeholder="1-31"
              icon="calendar"
              keyboardType="number-pad"
              error={payDayError}
            />

            <ButtonPrimary
              label={submitting ? 'Kaydediliyor…' : 'Kaydet ve İlerle'}
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
