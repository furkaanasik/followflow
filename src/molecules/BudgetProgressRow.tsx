import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/atoms';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface BudgetProgressRowProps {
  name: string;
  subtitle: string;
  progress: number;
  progressColor?: keyof ColorTokens;
}

export function BudgetProgressRow({
  name,
  subtitle,
  progress,
  progressColor = 'accentTeal',
}: BudgetProgressRowProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text
          style={{
            fontFamily: theme.fonts.body.semibold,
            fontSize: 14,
            color: theme.colors.textPrimary,
          }}
        >
          {name}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.body.medium,
            fontSize: 12,
            color: theme.colors.textSecondary,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <ProgressBar value={progress} color={progressColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
});
