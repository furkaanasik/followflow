import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setFormError(t('onboarding.genericError'));
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
          setTargetAmountError(t('validation.amountInvalid'));
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
      setFormError(t('onboarding.saveFailed'));
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
            <StepBadge
              icon="target"
              label={t('onboarding.step', { current: 3, total: 3 })}
            />
            <TitleSubtitle
              title={t('onboarding.goal.title')}
              subtitle={t('onboarding.goal.subtitle')}
            />
          </View>

          <SurfaceCard>
            {formError ? <AlertBanner message={formError} /> : null}

            <FormFieldGroup
              label={t('onboarding.goal.nameLabel')}
              value={draft.name}
              onChangeText={(name) => dispatch(updateGoalDraft({ name }))}
              placeholder={t('onboarding.goal.namePlaceholder')}
              icon="target"
            />
            <FormFieldGroup
              label={t('onboarding.goal.targetLabel')}
              value={draft.targetAmount}
              onChangeText={(targetAmount) =>
                dispatch(updateGoalDraft({ targetAmount }))
              }
              placeholder={t('onboarding.amountPlaceholder')}
              icon="banknote"
              keyboardType="decimal-pad"
              error={targetAmountError}
            />
            <FormFieldGroup
              label={t('onboarding.goal.savedLabel')}
              value={draft.savedAmount}
              onChangeText={(savedAmount) =>
                dispatch(updateGoalDraft({ savedAmount }))
              }
              placeholder={t('onboarding.amountPlaceholder')}
              icon="piggy-bank"
              keyboardType="decimal-pad"
            />

            <ButtonPrimary
              label={
                submitting ? t('onboarding.saving') : t('onboarding.goal.save')
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
