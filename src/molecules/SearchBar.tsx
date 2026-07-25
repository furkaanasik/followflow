import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BadgeCount, ButtonIconOnly, InputField } from '@/atoms';
import { useTheme } from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onFilterPress?: () => void;
  filterCount?: number;
  placeholder?: string;
  filterLabel?: string;
}

export function SearchBar({
  value,
  onChangeText,
  onFilterPress,
  filterCount = 0,
  placeholder = 'İşlem ara...',
  filterLabel = 'Filtrele',
}: SearchBarProps) {
  const theme = useTheme();
  // The filter button mirrors the input's measured height so the pair always
  // lines up regardless of font metrics.
  const [inputHeight, setInputHeight] = useState(44);
  return (
    <View style={[styles.container, { gap: theme.spacing.sm }]}>
      <View
        style={styles.inputWrapper}
        onLayout={(e) =>
          setInputHeight(Math.round(e.nativeEvent.layout.height))
        }
      >
        <InputField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          icon="search"
        />
      </View>
      {onFilterPress ? (
        <View>
          <ButtonIconOnly
            icon="sliders-horizontal"
            variant="surface"
            size={inputHeight}
            onPress={onFilterPress}
            accessibilityLabel={filterLabel}
          />
          <View style={styles.badge} pointerEvents="none">
            <BadgeCount count={filterCount} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  inputWrapper: { flex: 1 },
  badge: { position: 'absolute', top: -4, right: -4 },
});
