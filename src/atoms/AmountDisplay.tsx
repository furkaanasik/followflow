import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface AmountDisplayProps {
  amount: string;
  tone?: 'neutral' | 'income' | 'expense';
}

export function AmountDisplay({
  amount,
  tone = 'neutral',
}: AmountDisplayProps) {
  const theme = useTheme();
  const color =
    tone === 'income'
      ? theme.colors.incomeGreen
      : tone === 'expense'
        ? theme.colors.expenseCoral
        : theme.colors.textPrimary;

  return (
    <View style={styles.container}>
      <Text
        style={{ fontFamily: theme.fonts.heading.bold, fontSize: 36, color }}
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
