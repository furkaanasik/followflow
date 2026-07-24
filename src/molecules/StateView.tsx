import { createElement } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ButtonSecondary } from '@/atoms';
import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface StateViewProps {
  variant: 'loading' | 'empty' | 'error';
  message?: string;
  icon?: string;
  onRetry?: () => void;
}

export function StateView({ variant, message, icon, onRetry }: StateViewProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.container,
        { gap: theme.spacing.md, padding: theme.spacing.lg },
      ]}
    >
      {variant === 'loading' ? (
        <ActivityIndicator
          color={theme.colors.accentTeal}
          accessibilityLabel={t('common.loading')}
        />
      ) : null}

      {variant === 'empty' ? (
        <>
          {icon
            ? createElement(getIcon(icon), {
                size: 28,
                color: theme.colors.textTertiary,
              })
            : null}
          {message ? (
            <Text
              style={[
                styles.message,
                {
                  fontFamily: theme.fonts.body.medium,
                  color: theme.colors.textTertiary,
                },
              ]}
            >
              {message}
            </Text>
          ) : null}
        </>
      ) : null}

      {variant === 'error' ? (
        <>
          {createElement(getIcon('circle-alert'), {
            size: 28,
            color: theme.colors.warningRed,
          })}
          <Text
            style={[
              styles.message,
              {
                fontFamily: theme.fonts.body.medium,
                color: theme.colors.textSecondary,
              },
            ]}
          >
            {message ?? t('common.connectionError')}
          </Text>
          {onRetry ? (
            <ButtonSecondary
              tone="accent"
              label={t('common.retry')}
              onPress={onRetry}
              style={styles.retry}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  retry: { alignSelf: 'center', paddingHorizontal: 24, height: 44 },
});
