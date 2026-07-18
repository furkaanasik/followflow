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

export interface ButtonSecondaryProps {
  label: string;
  icon?: string;
  tone?: 'neutral' | 'destructive';
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ButtonSecondary({
  label,
  icon,
  tone = 'neutral',
  onPress,
  style,
}: ButtonSecondaryProps) {
  const theme = useTheme();
  const contentColor =
    tone === 'destructive'
      ? theme.colors.expenseCoral
      : theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          borderRadius: theme.radius.sm,
          borderColor: theme.colors.borderSubtle,
        },
        style,
      ]}
    >
      {icon
        ? createElement(getIcon(icon), { size: 16, color: contentColor })
        : null}
      <Text
        style={{
          fontFamily: theme.fonts.body.semibold,
          fontSize: 14,
          color: contentColor,
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
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
});
