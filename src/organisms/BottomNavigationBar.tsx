import { Platform, StyleSheet, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { NavItem } from '@/molecules';
import { useTheme } from '@/theme';

export interface NavBarItem {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
}

export interface BottomNavigationBarProps {
  items: NavBarItem[];
}

export function BottomNavigationBar({ items }: BottomNavigationBarProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: theme.radius.full,
          backgroundColor: withAlpha(theme.colors.bgSurface, 'F2'),
          borderColor: theme.colors.borderSubtle,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
        },
        // Android elevation renders a murky block behind the translucent
        // pill, so the lift comes from the border there; iOS gets a soft
        // shadow matching the design.
        Platform.OS === 'ios' ? styles.iosShadow : null,
      ]}
    >
      {items.map((item) => (
        <NavItem key={item.label} {...item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  iosShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
});
