import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface NetDurumCardProps {
  label?: string;
  amount: string;
  incomeAmount: string;
  expenseAmount: string;
  incomeLabel?: string;
  expenseLabel?: string;
}

export function NetDurumCard({
  label = 'BU AY NET DURUM',
  amount,
  incomeAmount,
  expenseAmount,
  incomeLabel = 'Gelir',
  expenseLabel = 'Gider',
}: NetDurumCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.bgSurface,
          padding: theme.spacing.lg,
          borderWidth: 1,
          borderColor: theme.colors.borderSubtle,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fonts.body.semibold,
          fontSize: 12,
          letterSpacing: 0.5,
          color: theme.colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 38,
          color: theme.colors.accentTeal,
        }}
      >
        {amount}
      </Text>
      <View style={styles.stats}>
        <StatCol
          icon="arrow-up"
          iconColor={theme.colors.incomeGreen}
          label={incomeLabel}
          value={incomeAmount}
          valueColor={theme.colors.incomeGreen}
        />
        <View
          style={[
            styles.divider,
            { backgroundColor: theme.colors.borderSubtle },
          ]}
        />
        <StatCol
          icon="arrow-down"
          iconColor={theme.colors.expenseCoral}
          label={expenseLabel}
          value={expenseAmount}
          valueColor={theme.colors.expenseCoral}
        />
      </View>
    </View>
  );
}

function StatCol({
  icon,
  iconColor,
  label,
  value,
  valueColor,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.statCol}>
      <View style={styles.statLabel}>
        {createElement(getIcon(icon), { size: 12, color: iconColor })}
        <Text
          style={{
            fontFamily: theme.fonts.body.medium,
            fontSize: 12,
            color: theme.colors.textSecondary,
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 16,
          color: valueColor,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 12 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  statCol: { flexDirection: 'column', gap: 4 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { width: 1, height: 32 },
});
