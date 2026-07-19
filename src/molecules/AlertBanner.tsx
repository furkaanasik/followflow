import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface AlertBannerProps {
  message: string;
  variant?: 'error' | 'info';
  icon?: string;
}

export function AlertBanner({
  message,
  variant = 'error',
  icon,
}: AlertBannerProps) {
  const theme = useTheme();
  const isError = variant === 'error';
  const color = isError ? theme.colors.warningRed : theme.colors.accentTeal;
  const backgroundColor = isError
    ? theme.colors.warningBg
    : theme.colors.accentTealDim;
  const iconName = icon ?? (isError ? 'circle-alert' : 'info');

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.sm,
          gap: theme.spacing.xs,
        },
      ]}
    >
      {createElement(getIcon(iconName), { size: 16, color })}
      <Text
        style={[styles.text, { fontFamily: theme.fonts.body.medium, color }]}
      >
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1, fontSize: 12, lineHeight: 17 },
});
