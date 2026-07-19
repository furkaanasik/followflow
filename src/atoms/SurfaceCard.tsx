import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface SurfaceCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SurfaceCard({ children, style }: SurfaceCardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderRadius: theme.radius.lg,
          backgroundColor: theme.colors.bgSurface,
          borderColor: theme.colors.borderSubtle,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
