import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavigationBar } from '@/organisms';

import { TAB_ROUTES } from './tabs';

export function AppTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const items = state.routes
    .map((route, index) => {
      const meta = TAB_ROUTES.find((r) => r.name === route.name);
      if (!meta) return null;
      return {
        icon: meta.icon,
        label: t(meta.titleKey),
        active: state.index === index,
        onPress: () => navigation.navigate(route.name),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + 8,
        alignItems: 'center',
      }}
      pointerEvents="box-none"
    >
      <BottomNavigationBar items={items} />
    </View>
  );
}
