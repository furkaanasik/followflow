import { createElement, useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { getIcon } from '@/lib/icons';
import { elevatedShadow } from '@/lib/shadow';
import { useTheme } from '@/theme';

export interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}

const CIRCLE = 36;

export function NavItem({
  icon,
  label,
  active = false,
  onPress,
}: NavItemProps) {
  const theme = useTheme();
  const color = active ? theme.colors.accentTeal : theme.colors.textSecondary;

  // Selected icon gets a teal circle that pops in place — no overflow above
  // the bar, just a quick scale-in.
  const raise = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    raise.value = withTiming(active ? 1 : 0, { duration: 130 });
  }, [active, raise]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.82 + raise.value * 0.18 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Animated.View
        style={[
          styles.circle,
          {
            borderRadius: theme.radius.full,
            backgroundColor: active ? theme.colors.accentTeal : 'transparent',
          },
          active ? elevatedShadow(theme.colors.accentTeal, 0.35, 5, 12) : null,
          circleStyle,
        ]}
      >
        {createElement(getIcon(icon), {
          size: 20,
          color: active ? theme.colors.bgApp : color,
        })}
      </Animated.View>
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
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 56,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
