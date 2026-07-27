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
// Small gap between segments so their butt caps never overlap at the seams
// (overlapping anti-aliased edges made the first/largest slice look ragged).
const GAP = 3;

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

  // A single category renders as a full ring, which reads as a plain circle
  // with no comparison to make. Fall back to a labelled full-width bar that
  // states the category, its amount, and the running total instead.
  if (slices.length === 1) {
    const slice = slices[0];
    return (
      <View style={styles.single}>
        <View style={styles.singleTop}>
          <View style={styles.singleLabel}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontFamily: theme.fonts.body.semibold,
                fontSize: 14,
                color: theme.colors.textPrimary,
              }}
            >
              {slice.label}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: theme.fonts.heading.bold,
              fontSize: 16,
              color: theme.colors.textPrimary,
            }}
          >
            {slice.amount}
          </Text>
        </View>
        <View
          style={[
            styles.singleTrack,
            {
              borderRadius: theme.radius.full,
              backgroundColor: theme.colors.bgSurfaceAlt,
            },
          ]}
        >
          <View
            style={{
              height: '100%',
              width: '100%',
              borderRadius: theme.radius.full,
              backgroundColor: slice.color,
            }}
          />
        </View>
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
    );
  }

  // Full angular length of each segment (used for positioning).
  const segments = slices.map((slice) => (slice.total / total) * CIRCUMFERENCE);
  const starts = segments.reduce<number[]>((acc, _seg, index) => {
    acc.push(index === 0 ? 0 : acc[index - 1] + segments[index - 1]);
    return acc;
  }, []);
  // Visible arc shrinks by GAP; offset shifts by GAP/2 to centre the gap.
  const useGap = slices.length > 1;
  const dashes = segments.map((seg) =>
    useGap ? Math.max(seg - GAP, 0.01) : seg,
  );
  const offsets = starts.map((start) => (useGap ? start + GAP / 2 : start));

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
  single: { gap: 8 },
  singleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  singleLabel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  singleTrack: { height: 10, width: '100%', overflow: 'hidden' },
  legend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
