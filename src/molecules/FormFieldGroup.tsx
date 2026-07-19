import { StyleSheet, Text, View } from 'react-native';

import { InputField, type InputFieldProps } from '@/atoms';
import { useTheme } from '@/theme';

export interface FormFieldGroupProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: InputFieldProps['keyboardType'];
  autoCapitalize?: InputFieldProps['autoCapitalize'];
  autoCorrect?: boolean;
}

export function FormFieldGroup({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
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
        rightIcon={rightIcon}
        onRightIconPress={onRightIconPress}
        rightIconAccessibilityLabel={rightIconAccessibilityLabel}
        error={Boolean(error)}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
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
