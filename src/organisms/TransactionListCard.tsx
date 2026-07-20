import { StyleSheet, Text, View } from 'react-native';

import {
  SwipeableRow,
  TransactionRow,
  type TransactionRowProps,
} from '@/molecules';
import { useTheme } from '@/theme';

export interface TransactionListCardProps {
  dateLabel: string;
  transactions: (TransactionRowProps & { id: string })[];
  onEditItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  editLabel?: string;
  deleteLabel?: string;
}

export function TransactionListCard({
  dateLabel,
  transactions,
  onEditItem,
  onDeleteItem,
  editLabel = 'Düzenle',
  deleteLabel = 'Sil',
}: TransactionListCardProps) {
  const theme = useTheme();
  const swipeable = onEditItem != null && onDeleteItem != null;
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
        {transactions.map(({ id, ...row }) =>
          swipeable ? (
            <SwipeableRow
              key={id}
              editLabel={editLabel}
              deleteLabel={deleteLabel}
              onEdit={() => onEditItem(id)}
              onDelete={() => onDeleteItem(id)}
            >
              <TransactionRow {...row} />
            </SwipeableRow>
          ) : (
            <TransactionRow key={id} {...row} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 10 },
});
