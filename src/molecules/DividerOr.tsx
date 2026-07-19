import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface DividerOrProps {
  label?: string;
}

export function DividerOr({ label }: DividerOrProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View
        style={[styles.line, { backgroundColor: theme.colors.borderSubtle }]}
      />
      <Text
        style={{
          fontFamily: theme.fonts.body.medium,
          fontSize: 12,
          color: theme.colors.textTertiary,
        }}
      >
        {label ?? t('common.or')}
      </Text>
      <View
        style={[styles.line, { backgroundColor: theme.colors.borderSubtle }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: 1 },
});
