import { createElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';
import type { ColorTokens } from '@/theme/tokens';

export interface InfoRowChevronProps {
  icon: string;
  label: string;
  value: string;
  valueColor?: keyof ColorTokens;
  onPress: () => void;
}

export function InfoRowChevron({
  icon,
  label,
  value,
  valueColor = 'textPrimary',
  onPress,
}: InfoRowChevronProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.bgSurfaceAlt,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      <View style={styles.left}>
        {createElement(getIcon(icon), {
          size: 14,
          color: theme.colors.accentTeal,
        })}
        <View style={styles.text}>
          <Text
            style={{
              fontFamily: theme.fonts.body.regular,
              fontSize: 12,
              color: theme.colors.textSecondary,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              fontFamily: theme.fonts.body.semibold,
              fontSize: 12,
              color: theme.colors[valueColor],
            }}
          >
            {value}
          </Text>
        </View>
      </View>
      {createElement(getIcon('chevron-right'), {
        size: 14,
        color: theme.colors.textTertiary,
      })}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
