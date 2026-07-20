import { createElement, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { withAlpha } from '@/lib/color';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface SwipeableRowProps {
  children: ReactNode;
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableRow({
  children,
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: SwipeableRowProps) {
  const theme = useTheme();
  const swipeable = useRef<SwipeableMethods>(null);

  function runAction(action: () => void) {
    swipeable.current?.close();
    action();
  }

  return (
    <ReanimatedSwipeable
      ref={swipeable}
      friction={2}
      rightThreshold={36}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={editLabel}
            onPress={() => runAction(onEdit)}
            style={({ pressed }) => [
              styles.action,
              {
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.bgSurfaceAlt,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            {createElement(getIcon('pencil'), {
              size: 18,
              color: theme.colors.accentTeal,
            })}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={deleteLabel}
            onPress={() => runAction(onDelete)}
            style={({ pressed }) => [
              styles.action,
              {
                borderRadius: theme.radius.sm,
                backgroundColor: withAlpha(theme.colors.expenseCoral, '26'),
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            {createElement(getIcon('trash-2'), {
              size: 18,
              color: theme.colors.expenseCoral,
            })}
          </Pressable>
        </View>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
