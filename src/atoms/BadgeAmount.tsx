import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface BadgeAmountProps {
  amount: string;
  direction: 'up' | 'down';
}

export function BadgeAmount({ amount, direction }: BadgeAmountProps) {
  const theme = useTheme();
  const color =
    direction === 'down' ? theme.colors.expenseCoral : theme.colors.incomeGreen;
  const backgroundColor =
    direction === 'down'
      ? theme.colors.expenseCoralDim
      : withAlpha(theme.colors.incomeGreen, '26');

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.full,
          backgroundColor,
        },
      ]}
    >
      {createElement(
        getIcon(direction === 'down' ? 'arrow-down' : 'arrow-up'),
        {
          size: 10,
          color,
        },
      )}
      <Text
        style={{ fontFamily: theme.fonts.body.semibold, fontSize: 12, color }}
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
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});
