import { createElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { withAlpha } from '@/lib/color';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface CategoryChipProps {
  icon: string;
  label: string;
  tint?: keyof ColorTokens;
  selected?: boolean;
  onPress: () => void;
}

export function CategoryChip({
  icon,
  label,
  tint = 'accentTeal',
  selected = false,
  onPress,
}: CategoryChipProps) {
  const theme = useTheme();
  const color = selected ? theme.colors.accentTeal : theme.colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.container,
        {
          borderRadius: theme.radius.full,
          backgroundColor: selected
            ? theme.colors.accentTealDim
            : theme.colors.bgSurfaceAlt,
          borderColor: selected
            ? withAlpha(theme.colors.accentTeal, '3D')
            : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {createElement(getIcon(icon), {
        size: 14,
        color: selected ? theme.colors.accentTeal : theme.colors[tint],
      })}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: selected
            ? theme.fonts.body.semibold
            : theme.fonts.body.medium,
          fontSize: 12,
          color,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
});
