import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ButtonIconOnly } from '@/atoms';
import { StepIndicator } from '@/molecules';
import { useTheme } from '@/theme';

export interface OnboardingTopBarProps {
  step: number;
  totalSteps?: number;
  onBack?: () => void;
  onSkip: () => void;
  skipLabel?: string;
  skipDisabled?: boolean;
}

export function OnboardingTopBar({
  step,
  totalSteps = 3,
  onBack,
  onSkip,
  skipLabel,
  skipDisabled = false,
}: OnboardingTopBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <ButtonIconOnly
            icon="arrow-left"
            variant="surface"
            accessibilityLabel={t('common.back')}
            onPress={onBack}
          />
        ) : null}
      </View>
      <StepIndicator steps={totalSteps} currentStep={step} />
      <View style={[styles.side, styles.right]}>
        <Pressable
          onPress={onSkip}
          hitSlop={8}
          style={styles.skipTap}
          disabled={skipDisabled}
        >
          <Text
            style={{
              fontFamily: theme.fonts.body.medium,
              fontSize: 13,
              color: theme.colors.textSecondary,
            }}
          >
            {skipLabel ?? t('common.skip')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: { width: 64, minHeight: 40, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  skipTap: { minHeight: 44, justifyContent: 'center' },
});
