import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';

export interface ButtonGoogleCTAProps {
  onPress: () => void;
  label?: string;
}

export function ButtonGoogleCTA({
  onPress,
  label = 'Google ile Giriş Yap',
}: ButtonGoogleCTAProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 18,
          color: '#4285F4',
        }}
      >
        G
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.body.semibold,
          fontSize: 15,
          color: '#1A1A1A',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
});
