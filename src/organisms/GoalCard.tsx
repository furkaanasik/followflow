import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CategoryIcon, ProgressBar } from '@/atoms';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface GoalCardProps {
  icon: string;
  name: string;
  targetLabel: string;
  percent: number;
  percentLabel?: string;
  amountsLabel: string;
  etaLabel: string;
}

export function GoalCard({
  icon,
  name,
  targetLabel,
  percent,
  percentLabel = 'tamamlandı',
  amountsLabel,
  etaLabel,
}: GoalCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurface,
          padding: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.row}>
        <CategoryIcon icon={icon} />
        <View style={styles.info}>
          <Text
            style={{
              fontFamily: theme.fonts.body.semibold,
              fontSize: 15,
              color: theme.colors.textPrimary,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.body.regular,
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}
          >
            {targetLabel}
          </Text>
        </View>
        <View style={styles.percentCol}>
          <Text
            style={{
              fontFamily: theme.fonts.heading.bold,
              fontSize: 16,
              color: theme.colors.accentTeal,
            }}
          >
            {`${percent}%`}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.body.regular,
              fontSize: 11,
              color: theme.colors.textTertiary,
            }}
          >
            {percentLabel}
          </Text>
        </View>
      </View>
      <ProgressBar value={percent} />
      <View style={styles.footer}>
        <Text
          style={{
            fontFamily: theme.fonts.body.regular,
            fontSize: 12,
            color: theme.colors.textSecondary,
          }}
        >
          {amountsLabel}
        </Text>
        <View style={styles.eta}>
          <Text
            style={{
              fontFamily: theme.fonts.body.regular,
              fontSize: 12,
              color: theme.colors.textTertiary,
            }}
          >
            {etaLabel}
          </Text>
          {createElement(getIcon('info'), {
            size: 12,
            color: theme.colors.textTertiary,
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flexDirection: 'column', gap: 2, flex: 1 },
  percentCol: { flexDirection: 'column', alignItems: 'flex-end' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
