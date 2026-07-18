import { createElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/atoms';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface RecurringPaymentCardProps {
  icon: string;
  name: string;
  amount: string;
  frequencyLabel: string;
  nextLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function RecurringPaymentCard({
  icon,
  name,
  amount,
  frequencyLabel,
  nextLabel,
  onEdit,
  onDelete,
}: RecurringPaymentCardProps) {
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
        <CategoryIcon icon={icon} />
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
              color: theme.colors.expenseCoral,
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
          {nextLabel}
        </Text>
      </View>
    </View>
  );
}

export function CardActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable onPress={onEdit} accessibilityLabel="Düzenle">
        {createElement(getIcon('pencil'), {
          size: 16,
          color: theme.colors.textSecondary,
        })}
      </Pressable>
      <Pressable onPress={onDelete} accessibilityLabel="Sil">
        {createElement(getIcon('trash'), {
          size: 16,
          color: theme.colors.expenseCoral,
        })}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flexDirection: 'column', gap: 2, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
