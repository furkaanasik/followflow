import { StyleSheet, Text, View } from 'react-native';

import { InputField } from '@/atoms';
import { useTheme } from '@/theme';

export interface FormFieldGroupProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  error?: string;
}

export function FormFieldGroup({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
}: FormFieldGroupProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: theme.fonts.body.semibold,
          fontSize: 12,
          color: theme.colors.textSecondary,
        }}
      >
        {label}
      </Text>
      <InputField
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        icon={icon}
        error={Boolean(error)}
      />
      {error ? (
        <Text
          style={{
            fontFamily: theme.fonts.body.medium,
            fontSize: 11,
            color: theme.colors.warningRed,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 6 },
});
