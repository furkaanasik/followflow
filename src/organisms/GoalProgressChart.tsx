import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface GoalProgressBar {
  label: string;
  value: number;
  current: boolean;
}

export interface GoalProgressChartProps {
  title: string;
  bars: GoalProgressBar[];
  emptyLabel: string;
}

const CHART_HEIGHT = 110;
const MAX_BAR_HEIGHT = 90;
const MIN_BAR_HEIGHT = 4;

export function GoalProgressChart({
  title,
  bars,
  emptyLabel,
}: GoalProgressChartProps) {
  const theme = useTheme();
  const max = Math.max(...bars.map((b) => b.value), 0);
  const isEmpty = max === 0;

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurface,
          padding: theme.spacing.md,
          gap: theme.spacing.sm,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fonts.heading.semibold,
          fontSize: 14,
          color: theme.colors.textPrimary,
        }}
      >
        {title}
      </Text>

      {isEmpty ? (
        <View style={styles.empty}>
          <Text
            style={{
              fontFamily: theme.fonts.body.medium,
              fontSize: 13,
              color: theme.colors.textTertiary,
            }}
          >
            {emptyLabel}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.barsRow}>
            {bars.map((bar) => (
              <View key={bar.label} style={styles.barSlot}>
                <View
                  style={{
                    width: '55%',
                    height: Math.max(
                      MIN_BAR_HEIGHT,
                      (bar.value / max) * MAX_BAR_HEIGHT,
                    ),
                    borderRadius: theme.radius.sm,
                    backgroundColor: bar.current
                      ? theme.colors.accentTeal
                      : theme.colors.accentTealDim,
                  }}
                />
              </View>
            ))}
          </View>
          <View style={styles.labelsRow}>
            {bars.map((bar) => (
              <Text
                key={bar.label}
                style={[
                  styles.label,
                  {
                    fontFamily: theme.fonts.body.medium,
                    color: bar.current
                      ? theme.colors.accentTeal
                      : theme.colors.textTertiary,
                  },
                ]}
              >
                {bar.label}
              </Text>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  empty: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barsRow: {
    height: CHART_HEIGHT - 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barSlot: { flex: 1, alignItems: 'center' },
  labelsRow: { flexDirection: 'row' },
  label: { flex: 1, fontSize: 10, textAlign: 'center' },
});
