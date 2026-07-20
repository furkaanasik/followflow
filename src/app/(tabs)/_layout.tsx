import { Tabs } from 'expo-router';

import { AppTabBar } from '@/navigation/AppTabBar';
import { TAB_ROUTES } from '@/navigation/tabs';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_ROUTES.map((route) => (
        <Tabs.Screen
          key={route.name}
          name={route.name}
          options={{ title: route.title }}
        />
      ))}
    </Tabs>
  );
}
