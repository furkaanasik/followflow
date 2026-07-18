import { StyleSheet, Text, View } from 'react-native';

import { TransactionRow, type TransactionRowProps } from '@/molecules';
import { useTheme } from '@/theme';

export interface TransactionListCardProps {
  dateLabel: string;
  transactions: (TransactionRowProps & { id: string })[];
}

export function TransactionListCard({
  dateLabel,
  transactions,
}: TransactionListCardProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: theme.fonts.body.semibold,
          fontSize: 13,
          color: theme.colors.textSecondary,
        }}
      >
        {dateLabel}
      </Text>
      <View>
        {transactions.map(({ id, ...row }) => (
          <TransactionRow key={id} {...row} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10 },
});
