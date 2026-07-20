import { StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/atoms';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface BudgetProgressRowProps {
  name: string;
  subtitle: string;
  subtitleColor?: keyof ColorTokens;
  progress: number;
  progressColor?: keyof ColorTokens;
}

export function BudgetProgressRow({
  name,
  subtitle,
  subtitleColor = 'textSecondary',
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
            color: theme.colors[subtitleColor],
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
