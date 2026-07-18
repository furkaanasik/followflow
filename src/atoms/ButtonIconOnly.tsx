import { createElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface ButtonIconOnlyProps {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'accent' | 'surface';
  size?: number;
}

export function ButtonIconOnly({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'accent',
  size = 40,
}: ButtonIconOnlyProps) {
  const theme = useTheme();
  const isSurface = variant === 'surface';

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 4, right: 4, bottom: 4, left: 4 }}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: isSurface ? theme.radius.sm : theme.radius.full,
          backgroundColor: isSurface
            ? theme.colors.bgSurfaceAlt
            : theme.colors.accentTeal,
        },
      ]}
    >
      {createElement(getIcon(icon), {
        size: Math.round(size * 0.45),
        color: isSurface ? theme.colors.textSecondary : theme.colors.bgApp,
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
