import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

import { CardActions } from './RecurringPaymentCard';

export interface IncomeSourceCardProps {
  name: string;
  amount: string;
  frequencyLabel: string;
  dayLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function IncomeSourceCard({
  name,
  amount,
  frequencyLabel,
  dayLabel,
  onEdit,
  onDelete,
}: IncomeSourceCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.borderSubtle,
          padding: theme.spacing.md,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text
            style={{
              fontFamily: theme.fonts.body.semibold,
              fontSize: 14,
              color: theme.colors.textPrimary,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.heading.bold,
              fontSize: 18,
              color: theme.colors.accentTeal,
            }}
          >
            {amount}
          </Text>
        </View>
        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </View>
      <View style={styles.metaRow}>
        <Text
          style={{
            fontFamily: theme.fonts.body.medium,
            fontSize: 12,
            color: theme.colors.textSecondary,
          }}
        >
          {frequencyLabel}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.body.regular,
            fontSize: 12,
            color: theme.colors.textTertiary,
          }}
        >
          ·
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.body.regular,
            fontSize: 12,
            color: theme.colors.textTertiary,
          }}
        >
          {dayLabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flexDirection: 'column', gap: 2, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
