import { StyleSheet, Text, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { useTheme } from '@/theme';

export interface HeatmapCellData {
  key: string;
  intensity: number; // 0-1
  amount: string; // formatted total, for screen readers
}

export interface HeatmapRowData {
  category: string;
  label: string;
  cells: HeatmapCellData[];
}

export interface CategoryHeatmapProps {
  title: string;
  monthLabels: string[];
  rows: HeatmapRowData[];
  emptyLabel: string;
}

const LABEL_WIDTH = 76;
const CELL_HEIGHT = 26;
// Legible floor for nonzero cells so faint spending stays visible.
const MIN_ALPHA = 0x22;

function intensityAlpha(intensity: number): string {
  const byte = Math.max(MIN_ALPHA, Math.min(255, Math.round(intensity * 255)));
  return byte.toString(16).padStart(2, '0');
}

export function CategoryHeatmap({
  title,
  monthLabels,
  rows,
  emptyLabel,
}: CategoryHeatmapProps) {
  const theme = useTheme();
  const isEmpty = rows.length === 0;

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
          <View style={styles.row}>
            <View style={{ width: LABEL_WIDTH }} />
            {monthLabels.map((label) => (
              <Text
                key={label}
                style={[
                  styles.monthLabel,
                  {
                    fontFamily: theme.fonts.body.medium,
                    color: theme.colors.textTertiary,
                  },
                ]}
              >
                {label}
              </Text>
            ))}
          </View>
          {rows.map((row) => (
            <View key={row.category} style={styles.row}>
              <Text
                numberOfLines={1}
                style={{
                  width: LABEL_WIDTH,
                  fontFamily: theme.fonts.body.medium,
                  fontSize: 11,
                  color: theme.colors.textSecondary,
                }}
              >
                {row.label}
              </Text>
              {row.cells.map((cell, index) => (
                <View
                  key={cell.key}
                  accessible
                  accessibilityLabel={`${monthLabels[index]} ${row.label}: ${cell.amount}`}
                  style={[
                    styles.cell,
                    {
                      borderRadius: theme.radius.sm - 4,
                      backgroundColor:
                        cell.intensity > 0
                          ? withAlpha(
                              theme.colors.accentTeal,
                              intensityAlpha(cell.intensity),
                            )
                          : theme.colors.bgSurfaceAlt,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  empty: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  monthLabel: {
    flex: 1,
    fontSize: 10,
    textAlign: 'center',
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
  },
});
