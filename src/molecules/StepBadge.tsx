import { createElement } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getIcon } from '@/lib/icons';
import { useTheme } from '@/theme';

export interface StepBadgeProps {
  icon: string;
  label: string;
}

export function StepBadge({ icon, label }: StepBadgeProps) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { gap: theme.spacing.sm }]}>
      <View
        style={[
          styles.badge,
          {
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.accentTealDim,
          },
        ]}
      >
        {createElement(getIcon(icon), {
          size: 18,
          color: theme.colors.accentTeal,
        })}
      </View>
      <Text
        style={[
          styles.label,
          {
            fontFamily: theme.fonts.body.semibold,
            color: theme.colors.accentTeal,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 12, letterSpacing: 0.8 },
});
