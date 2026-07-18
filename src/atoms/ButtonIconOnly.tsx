import { createElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface ButtonIconOnlyProps {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
}

export function ButtonIconOnly({
  icon,
  onPress,
  accessibilityLabel,
}: ButtonIconOnlyProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
      style={[
        styles.container,
        {
          borderRadius: theme.radius.full,
          backgroundColor: theme.colors.accentTeal,
        },
      ]}
    >
      {createElement(getIcon(icon), { size: 20, color: theme.colors.bgApp })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
