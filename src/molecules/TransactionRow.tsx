import { StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/atoms';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface TransactionRowProps {
  icon: string;
  iconTint?: keyof ColorTokens;
  title: string;
  subtitle: string;
  amount: string;
  tone?: 'income' | 'expense' | 'neutral';
}

export function TransactionRow({
  icon,
  iconTint = 'accentTeal',
  title,
  subtitle,
  amount,
  tone = 'neutral',
}: TransactionRowProps) {
  const theme = useTheme();
  const amountColor =
    tone === 'income'
      ? theme.colors.incomeGreen
      : tone === 'expense'
        ? theme.colors.expenseCoral
        : theme.colors.textPrimary;

  return (
    <View style={styles.container}>
      <CategoryIcon icon={icon} tint={iconTint} />
      <View style={styles.info}>
        <Text
          style={{
            fontFamily: theme.fonts.body.semibold,
            fontSize: 15,
            color: theme.colors.textPrimary,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: theme.fonts.body.regular,
            fontSize: 12,
            color: theme.colors.textSecondary,
          }}
        >
          {subtitle}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 15,
          color: amountColor,
        }}
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  info: { flexDirection: 'column', gap: 2, flex: 1 },
});
