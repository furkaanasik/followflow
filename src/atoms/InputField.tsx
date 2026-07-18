import { createElement, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface InputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  editable?: boolean;
  error?: boolean;
}

export function InputField({
  value,
  onChangeText,
  placeholder = 'Ara...',
  icon,
  editable = true,
  error = false,
}: InputFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.warningRed
    : focused
      ? theme.colors.accentTeal
      : 'transparent';

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.bgSurfaceAlt,
          gap: theme.spacing.xs,
          borderColor,
        },
      ]}
    >
      {icon
        ? createElement(getIcon(icon), {
            size: 16,
            color: theme.colors.textTertiary,
          })
        : null}
      <TextInput
        style={{
          flex: 1,
          fontFamily: theme.fonts.body.regular,
          fontSize: 14,
          color: theme.colors.textPrimary,
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        editable={editable}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
});
