import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface SegmentedToggleOption {
  label: string;
  value: string;
}

export interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedToggle({
  options,
  value,
  onChange,
}: SegmentedToggleProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                borderRadius: theme.radius.sm,
                paddingVertical: theme.spacing.sm,
                paddingHorizontal: theme.spacing.md,
                backgroundColor: selected
                  ? theme.colors.accentTealDim
                  : theme.colors.bgSurfaceAlt,
              },
            ]}
          >
            <Text
              style={{
                fontFamily: selected
                  ? theme.fonts.body.semibold
                  : theme.fonts.body.medium,
                fontSize: 13,
                color: selected
                  ? theme.colors.accentTeal
                  : theme.colors.textSecondary,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
