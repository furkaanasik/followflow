import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface TrendChartPoint {
  key: string; // YYYY-MM / YYYY — unique; labels may collide if window grows
  label: string;
  income: number;
  expense: number;
  incomeAmount: string;
  expenseAmount: string;
  current: boolean;
}

export interface TrendChartProps {
  title: string;
  points: TrendChartPoint[];
  emptyLabel: string;
  incomeLabel: string;
  expenseLabel: string;
}

const CHART_HEIGHT = 110;
const MAX_BAR_HEIGHT = 90;
const MIN_BAR_HEIGHT = 4;

export function TrendChart({
  title,
  points,
  emptyLabel,
  incomeLabel,
  expenseLabel,
}: TrendChartProps) {
  const theme = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const max = Math.max(...points.flatMap((p) => [p.income, p.expense]), 0);
  const isEmpty = max === 0;
  const selectedPoint = selected !== null ? points[selected] : null;

  const barHeight = (value: number) =>
    value > 0 && max > 0
      ? Math.max(MIN_BAR_HEIGHT, (value / max) * MAX_BAR_HEIGHT)
      : 0;

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
      <View style={styles.header}>
        <Text
          style={{
            fontFamily: theme.fonts.heading.semibold,
            fontSize: 14,
            color: theme.colors.textPrimary,
          }}
        >
          {title}
        </Text>
        <View style={[styles.legend, { gap: theme.spacing.sm }]}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.incomeGreen },
              ]}
            />
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 11,
                color: theme.colors.textSecondary,
              }}
            >
              {incomeLabel}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: theme.colors.expenseCoral },
              ]}
            />
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 11,
                color: theme.colors.textSecondary,
              }}
            >
              {expenseLabel}
            </Text>
          </View>
        </View>
      </View>

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
            {points.map((point, index) => {
              const dimmed = selected !== null && selected !== index;
              return (
                <Pressable
                  key={point.key}
                  style={styles.barSlot}
                  accessibilityRole="button"
                  accessibilityLabel={point.label}
                  accessibilityValue={{
                    text: `${incomeLabel} ${point.incomeAmount}, ${expenseLabel} ${point.expenseAmount}`,
                  }}
                  onPress={() =>
                    setSelected((prev) => (prev === index ? null : index))
                  }
                >
                  <View
                    style={{
                      width: '22%',
                      height: barHeight(point.income),
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.incomeGreen,
                      opacity: dimmed ? 0.35 : 1,
                    }}
                  />
                  <View
                    style={{
                      width: '22%',
                      height: barHeight(point.expense),
                      borderRadius: theme.radius.sm,
                      backgroundColor: theme.colors.expenseCoral,
                      opacity: dimmed ? 0.35 : 1,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={styles.labelsRow}>
            {points.map((point, index) => (
              <Text
                key={point.key}
                style={[
                  styles.label,
                  {
                    fontFamily:
                      selected === index
                        ? theme.fonts.body.semibold
                        : theme.fonts.body.medium,
                    color:
                      selected === index || point.current
                        ? theme.colors.accentTeal
                        : theme.colors.textTertiary,
                  },
                ]}
              >
                {point.label}
              </Text>
            ))}
          </View>
          {selectedPoint ? (
            <View
              style={[
                styles.detail,
                {
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors.bgSurfaceAlt,
                  padding: theme.spacing.sm,
                  gap: theme.spacing.md,
                },
              ]}
            >
              <Text
                style={{
                  fontFamily: theme.fonts.body.semibold,
                  fontSize: 12,
                  color: theme.colors.textPrimary,
                }}
              >
                {selectedPoint.label}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.body.semibold,
                  fontSize: 12,
                  color: theme.colors.incomeGreen,
                }}
              >
                {`${incomeLabel}: ${selectedPoint.incomeAmount}`}
              </Text>
              <Text
                style={{
                  fontFamily: theme.fonts.body.semibold,
                  fontSize: 12,
                  color: theme.colors.expenseCoral,
                }}
              >
                {`${expenseLabel}: ${selectedPoint.expenseAmount}`}
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legend: { flexDirection: 'row', alignItems: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
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
  barSlot: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
  },
  labelsRow: { flexDirection: 'row' },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  label: { flex: 1, fontSize: 10, textAlign: 'center' },
});
