import { StyleSheet, Text, View } from 'react-native';

import { CategoryIcon, ProgressBar } from '@/atoms';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface BudgetCardProps {
  icon: string;
  categoryName: string;
  percent: number;
  footerLabel: string;
  overLimit?: boolean;
}

export function BudgetCard({
  icon,
  categoryName,
  percent,
  footerLabel,
  overLimit = false,
}: BudgetCardProps) {
  const theme = useTheme();
  const accent: keyof ColorTokens = overLimit ? 'warningRed' : 'accentTeal';
  const accentColor = theme.colors[accent];

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurface,
          borderColor: overLimit
            ? theme.colors.warningRed
            : theme.colors.borderSubtle,
          borderWidth: overLimit ? 1.5 : 1,
          padding: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.left}>
          <CategoryIcon icon={icon} tint={accent} />
          <Text
            style={{
              fontFamily: theme.fonts.heading.semibold,
              fontSize: 14,
              color: theme.colors.textPrimary,
            }}
          >
            {categoryName}
          </Text>
        </View>
        <Text
          style={{
            fontFamily: theme.fonts.body.semibold,
            fontSize: 13,
            color: overLimit
              ? theme.colors.warningRed
              : theme.colors.textTertiary,
          }}
        >
          {`%${percent}`}
        </Text>
      </View>
      <ProgressBar value={percent} color={accent} />
      <Text
        style={{
          fontFamily: theme.fonts.body.medium,
          fontSize: 12,
          color: accentColor,
        }}
      >
        {footerLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
