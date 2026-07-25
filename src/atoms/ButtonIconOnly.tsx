import { createElement } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface ButtonIconOnlyProps {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'accent' | 'surface';
  size?: number;
  iconColor?: keyof ColorTokens;
  testID?: string;
}

export function ButtonIconOnly({
  icon,
  onPress,
  accessibilityLabel,
  variant = 'accent',
  size = 44,
  iconColor,
  testID,
}: ButtonIconOnlyProps) {
  const theme = useTheme();
  const isSurface = variant === 'surface';
  // Extend the touchable area so buttons smaller than 44dp (e.g. the 32dp
  // contribution delete) still meet the minimum tap target.
  const slop = Math.max(4, Math.ceil((44 - size) / 2));

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: slop, right: slop, bottom: slop, left: slop }}
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
        color: iconColor
          ? theme.colors[iconColor]
          : isSurface
            ? theme.colors.textSecondary
            : theme.colors.bgApp,
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
