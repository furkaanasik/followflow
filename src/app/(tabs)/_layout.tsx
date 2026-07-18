import { Tabs } from 'expo-router';

import { TAB_ROUTES } from '@/navigation/tabs';

export default function TabLayout() {
  return (
    <Tabs>
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
