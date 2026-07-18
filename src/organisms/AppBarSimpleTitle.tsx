import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface AppBarSimpleTitleProps {
  title: string;
}

export function AppBarSimpleTitle({ title }: AppBarSimpleTitleProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 22,
          color: theme.colors.textPrimary,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
});
