import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';

export interface NumpadKeyProps {
  label: string;
  onPress: () => void;
}

export function NumpadKey({ label, onPress }: NumpadKeyProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text
        style={{
          fontFamily: theme.fonts.heading.semibold,
          fontSize: 22,
          color: theme.colors.textPrimary,
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
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
