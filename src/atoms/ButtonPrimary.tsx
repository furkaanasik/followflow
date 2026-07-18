import { createElement } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface ButtonPrimaryProps {
  label: string;
  icon?: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ButtonPrimary({
  label,
  icon,
  onPress,
  disabled = false,
  style,
}: ButtonPrimaryProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        {
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.accentTeal,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon
        ? createElement(getIcon(icon), { size: 18, color: theme.colors.bgApp })
        : null}
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 16,
          color: theme.colors.bgApp,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
