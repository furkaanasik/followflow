import { StyleSheet, Text, View } from 'react-native';

import { ButtonIconOnly } from '@/atoms';
import { useTheme } from '@/theme';

export interface AppBarBackTitleProps {
  title: string;
  onBack: () => void;
}

export function AppBarBackTitle({ title, onBack }: AppBarBackTitleProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <ButtonIconOnly
        icon="arrow-left"
        onPress={onBack}
        accessibilityLabel="Geri"
        variant="surface"
        size={36}
        iconColor="textPrimary"
      />
      <Text
        style={{
          fontFamily: theme.fonts.heading.bold,
          fontSize: 16,
          color: theme.colors.textPrimary,
        }}
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
