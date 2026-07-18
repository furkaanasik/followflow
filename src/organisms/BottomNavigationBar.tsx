import { StyleSheet, View } from 'react-native';

import { withAlpha } from '@/lib/color';
import { elevatedShadow } from '@/lib/shadow';
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
          backgroundColor: withAlpha(theme.colors.bgSurface, 'E6'),
          borderColor: theme.colors.borderSubtle,
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.sm,
          ...elevatedShadow('#000000', 0.4, 8, 24),
        },
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
});
