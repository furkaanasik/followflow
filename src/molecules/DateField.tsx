import { Pressable, StyleSheet, Text } from 'react-native';

import { formatDate } from '@/lib/format';
import { useTheme } from '@/theme';

export interface DateFieldProps {
  value: string | null;
  placeholder: string;
  onPress: () => void;
  testID?: string;
}

// Pressable input-look-alike showing a formatted date or its placeholder.
export function DateField({
  value,
  placeholder,
  onPress,
  testID,
}: DateFieldProps) {
  const theme = useTheme();
  const label = value
    ? formatDate(value, { day: 'numeric', month: 'short' })
    : null;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label ? `${placeholder}: ${label}` : placeholder}
      style={({ pressed }) => [
        styles.container,
        {
          borderRadius: theme.radius.sm,
          backgroundColor: theme.colors.bgSurfaceAlt,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: theme.fonts.body.regular,
          fontSize: 14,
          color: value ? theme.colors.textPrimary : theme.colors.textTertiary,
        }}
      >
        {label ?? placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
});
