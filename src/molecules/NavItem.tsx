import { createElement } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}

export function NavItem({
  icon,
  label,
  active = false,
  onPress,
}: NavItemProps) {
  const theme = useTheme();
  const color = active ? theme.colors.accentTeal : theme.colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.container,
        {
          borderRadius: theme.radius.full,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          backgroundColor: active ? theme.colors.accentTealDim : 'transparent',
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      {createElement(getIcon(icon), { size: 20, color })}
      <Text
        numberOfLines={1}
        style={{ fontFamily: theme.fonts.body.semibold, fontSize: 10, color }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', alignItems: 'center', gap: 2 },
});
