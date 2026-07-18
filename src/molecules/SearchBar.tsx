import { StyleSheet, View } from 'react-native';

import { ButtonIconOnly, InputField } from '@/atoms';
import { useTheme } from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  placeholder = 'İşlem ara...',
}: SearchBarProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.sm }]}>
      <View style={styles.inputWrapper}>
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          icon="search"
        />
      </View>
      <ButtonIconOnly
        icon="sliders-horizontal"
        variant="surface"
        size={44}
        onPress={onFilterPress}
        accessibilityLabel="Filtrele"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  inputWrapper: { flex: 1 },
});
