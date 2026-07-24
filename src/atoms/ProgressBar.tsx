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
  // A sub-1% value would render as an invisible sliver; floor any real spend
  // to a legible minimum so the bar never reads as empty when it isn't.
  const width = clamped > 0 ? Math.max(clamped, 3) : 0;

  return (
    <View
      style={[
        styles.track,
        {
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.bgSurfaceAlt,
          // Hairline outline keeps the empty (0%) track visible against
          // low-contrast surfaces so the bar is legible before any spend.
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      {width > 0 ? (
        <View
          style={[
            styles.fill,
            {
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors[color],
              width: `${width}%`,
            },
          ]}
        />
      ) : null}
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
