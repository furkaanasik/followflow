import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

export interface StepIndicatorProps {
  steps: number;
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.xs }]}>
      {Array.from({ length: steps }, (_, i) => i + 1).map((step) => {
        const active = step === currentStep;
        return (
          <View
            key={step}
            style={[
              styles.dot,
              {
                width: active ? 24 : 8,
                borderRadius: theme.radius.full,
                backgroundColor: active
                  ? theme.colors.accentTeal
                  : theme.colors.borderSubtle,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row' },
  dot: { height: 6 },
});
