import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ButtonPrimary, SurfaceCard } from '@/atoms';
import {
  AlertBanner,
  FormFieldGroup,
  StepBadge,
  TitleSubtitle,
} from '@/molecules';
import { OnboardingTopBar } from '@/organisms';
import { useCreateGoalMutation, useUpdateProfileMutation } from '@/store/api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  resetOnboardingDrafts,
  updateGoalDraft,
} from '@/store/slices/onboardingSlice';
import { useTheme } from '@/theme';

export function OnboardingGoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.auth.session);
  const draft = useAppSelector((s) => s.onboarding.goalDraft);
  const [createGoal, { isLoading: creatingGoal }] = useCreateGoalMutation();
  const [updateProfile, { isLoading: updatingProfile }] =
    useUpdateProfileMutation();

  const [targetAmountError, setTargetAmountError] = useState<
    string | undefined
  >();
  const [formError, setFormError] = useState<string | undefined>();
  // Guards against a duplicate goal row when createGoal succeeded but the
  // subsequent updateProfile failed and the user retries.
  const goalCreated = useRef(false);

  const submitting = creatingGoal || updatingProfile;

  function handleBack() {
    router.push({
      pathname: '/(onboarding)/recurring',
      params: { back: '1' },
    });
  }

  async function handleSkip() {
    setFormError(undefined);
    try {
      await updateProfile({ onboarding_completed: true }).unwrap();
      dispatch(resetOnboardingDrafts());
    } catch {
      setFormError('Bir şeyler ters gitti. Tekrar dene.');
    }
  }

  async function handleSave() {
    setTargetAmountError(undefined);
    setFormError(undefined);

    try {
      if (
        !goalCreated.current &&
        draft.name.trim() &&
        draft.targetAmount.trim()
      ) {
        const parsedTarget = Number(draft.targetAmount.replace(',', '.'));
        if (Number.isNaN(parsedTarget) || parsedTarget <= 0) {
          setTargetAmountError('Geçerli bir tutar gir.');
          return;
        }
        await createGoal({
          user_id: session!.user.id,
          icon: 'target',
          name: draft.name,
          target_amount: parsedTarget,
          ...(draft.savedAmount.trim()
            ? { current_amount: Number(draft.savedAmount.replace(',', '.')) }
            : {}),
        }).unwrap();
        goalCreated.current = true;
      }
      await updateProfile({ onboarding_completed: true }).unwrap();
      dispatch(resetOnboardingDrafts());
    } catch {
      setFormError('Kaydedilemedi. Bağlantını kontrol edip tekrar dene.');
    }
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
          <OnboardingTopBar
            step={3}
            onBack={handleBack}
            onSkip={handleSkip}
            skipDisabled={submitting}
          />

          <View style={{ gap: theme.spacing.sm }}>
            <StepBadge icon="target" label="ADIM 3/3" />
            <TitleSubtitle
              title="Bir Tasarruf Hedefi Belirle"
              subtitle="Opsiyonel — istersen şimdi bir hedef koy, istersen daha sonra ekle."
            />
          </View>

          <SurfaceCard>
            {formError ? <AlertBanner message={formError} /> : null}

            <FormFieldGroup
              label="Hedef Adı"
              value={draft.name}
              onChangeText={(name) => dispatch(updateGoalDraft({ name }))}
              placeholder="örn. Tatil"
              icon="target"
            />
            <FormFieldGroup
              label="Hedef Tutarı"
              value={draft.targetAmount}
              onChangeText={(targetAmount) =>
                dispatch(updateGoalDraft({ targetAmount }))
              }
              placeholder="₺0,00"
              icon="banknote"
              keyboardType="decimal-pad"
              error={targetAmountError}
            />
            <FormFieldGroup
              label="Mevcut Birikim (opsiyonel)"
              value={draft.savedAmount}
              onChangeText={(savedAmount) =>
                dispatch(updateGoalDraft({ savedAmount }))
              }
              placeholder="₺0,00"
              icon="piggy-bank"
              keyboardType="decimal-pad"
            />

            <ButtonPrimary
              label={submitting ? 'Kaydediliyor…' : 'Hedefi Kaydet ve Başla'}
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
