import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface CategoryIconProps {
  icon: string;
  tint?: keyof ColorTokens;
  color?: string;
  size?: number;
}

export function CategoryIcon({
  icon,
  tint = 'accentTeal',
  color,
  size = 44,
}: CategoryIconProps) {
  const theme = useTheme();
  const tintColor = color ?? theme.colors[tint];

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: theme.radius.full,
          backgroundColor: withAlpha(tintColor, '26'),
        },
      ]}
    >
      {createElement(getIcon(icon), {
        size: Math.round(size * 0.45),
        color: tintColor,
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
