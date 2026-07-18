import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface ProgressBarProps {
  value: number;
  color?: keyof ColorTokens;
}

export function ProgressBar({ value, color = 'accentTeal' }: ProgressBarProps) {
  const theme = useTheme();
  const clamped = Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : 0;

  return (
    <View
      style={[
        styles.track,
        {
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.bgSurfaceAlt,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors[color],
            width: `${clamped}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: 8,
  },
});
