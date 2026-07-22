import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { useTheme } from '@/theme';

export interface BreakdownSlice {
  category: string;
  label: string;
  total: number;
  amount: string;
  color: string;
}

export interface CategoryBreakdownCardProps {
  slices: BreakdownSlice[];
  total: number;
  totalLabel: string;
  caption: string;
  emptyLabel: string;
}

const SIZE = 140;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CategoryBreakdownCard({
  slices,
  total,
  totalLabel,
  caption,
  emptyLabel,
}: CategoryBreakdownCardProps) {
  const theme = useTheme();

  if (total <= 0 || slices.length === 0) {
    return (
      <Text
        style={{
          fontFamily: theme.fonts.body.medium,
          fontSize: 13,
          color: theme.colors.textTertiary,
        }}
      >
        {emptyLabel}
      </Text>
    );
  }

  const dashes = slices.map((slice) => (slice.total / total) * CIRCUMFERENCE);
  const offsets = dashes.reduce<number[]>((acc, _dash, index) => {
    acc.push(index === 0 ? 0 : acc[index - 1] + dashes[index - 1]);
    return acc;
  }, []);

  return (
    <View style={styles.row}>
      <View style={styles.donut}>
        <Svg width={SIZE} height={SIZE}>
          <G rotation={-90} origin={`${SIZE / 2}, ${SIZE / 2}`}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={theme.colors.bgSurfaceAlt}
              strokeWidth={STROKE}
              fill="none"
            />
            {slices.map((slice, index) => (
              <Circle
                key={slice.category}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                stroke={slice.color}
                strokeWidth={STROKE}
                fill="none"
                strokeLinecap="butt"
                strokeDasharray={`${dashes[index]} ${CIRCUMFERENCE - dashes[index]}`}
                strokeDashoffset={-offsets[index]}
              />
            ))}
          </G>
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
            style={{
              fontFamily: theme.fonts.heading.bold,
              fontSize: 18,
              color: theme.colors.textPrimary,
              textAlign: 'center',
            }}
          >
            {totalLabel}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.body.regular,
              fontSize: 11,
              color: theme.colors.textTertiary,
            }}
          >
            {caption}
          </Text>
        </View>
      </View>

      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.category} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: theme.fonts.body.medium,
                fontSize: 13,
                color: theme.colors.textPrimary,
              }}
            >
              {slice.label}
            </Text>
            <Text
              style={{
                fontFamily: theme.fonts.body.medium,
                fontSize: 12,
                color: theme.colors.textSecondary,
              }}
            >
              {slice.amount}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  donut: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    // Keep the label inside the donut hole (ring stroke eats STROKE px per side).
    paddingHorizontal: STROKE + 4,
  },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
