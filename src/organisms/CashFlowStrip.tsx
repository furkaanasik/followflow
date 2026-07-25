import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface CashFlowStripProps {
  title: string;
  values: { day: number; net: number }[];
  emptyLabel: string;
}

const STRIP_HEIGHT = 96;
const MAX_BAR_HEIGHT = 40;
const MIN_BAR_HEIGHT = 3;

export function CashFlowStrip({
  title,
  values,
  emptyLabel,
}: CashFlowStripProps) {
  const theme = useTheme();
  const max = Math.max(...values.map((v) => Math.abs(v.net)), 0);
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
        <View style={styles.barsRow}>
          {values.map((value) => {
            const height =
              value.net === 0
                ? 0
                : Math.max(
                    MIN_BAR_HEIGHT,
                    (Math.abs(value.net) / max) * MAX_BAR_HEIGHT,
                  );
            const positive = value.net > 0;
            return (
              <View key={value.day} style={styles.barSlot}>
                <View style={styles.halfTop}>
                  {positive && height > 0 && (
                    <View
                      style={{
                        width: '60%',
                        height,
                        borderTopLeftRadius: 2,
                        borderTopRightRadius: 2,
                        backgroundColor: theme.colors.incomeGreen,
                      }}
                    />
                  )}
                </View>
                <View
                  style={[
                    styles.baseline,
                    { backgroundColor: theme.colors.borderSubtle },
                  ]}
                />
                <View style={styles.halfBottom}>
                  {!positive && height > 0 && (
                    <View
                      style={{
                        width: '60%',
                        height,
                        borderBottomLeftRadius: 2,
                        borderBottomRightRadius: 2,
                        backgroundColor: theme.colors.expenseCoral,
                      }}
                    />
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column' },
  empty: {
    height: STRIP_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barsRow: {
    height: STRIP_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barSlot: { flex: 1, alignItems: 'center' },
  halfTop: {
    height: MAX_BAR_HEIGHT,
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  halfBottom: {
    height: MAX_BAR_HEIGHT,
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  baseline: { alignSelf: 'stretch', height: 1 },
});
