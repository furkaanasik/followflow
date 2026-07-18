import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface DividerOrProps {
  label?: string;
}

export function DividerOr({ label = 'veya' }: DividerOrProps) {
  const theme = useTheme();
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
        {label}
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
