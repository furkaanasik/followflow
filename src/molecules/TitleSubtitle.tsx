import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface TitleSubtitleProps {
  title: string;
  subtitle: string;
}

export function TitleSubtitle({ title, subtitle }: TitleSubtitleProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 24,
          color: theme.colors.textPrimary,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontFamily: theme.fonts.body.regular,
          fontSize: 13,
          color: theme.colors.textSecondary,
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 2 },
});
