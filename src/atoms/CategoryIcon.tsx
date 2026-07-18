import { createElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface CategoryIconProps {
  icon: string;
  tint?: keyof ColorTokens;
}

export function CategoryIcon({ icon, tint = 'accentTeal' }: CategoryIconProps) {
  const theme = useTheme();
  const tintColor = theme.colors[tint];

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.full,
          backgroundColor: withAlpha(tintColor, '26'),
        },
      ]}
    >
      {createElement(getIcon(icon), { size: 20, color: tintColor })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
