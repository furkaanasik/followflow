import { createElement } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { withAlpha } from '@/lib/color';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface ButtonSecondaryProps {
  label: string;
  icon?: string;
  tone?: 'neutral' | 'destructive' | 'accent';
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
      : tone === 'accent'
        ? theme.colors.accentTeal
        : theme.colors.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          borderRadius: theme.radius.sm,
          borderColor:
            tone === 'accent'
              ? withAlpha(theme.colors.accentTeal, '3D')
              : theme.colors.borderSubtle,
          backgroundColor:
            tone === 'accent' ? theme.colors.accentTealDim : 'transparent',
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
