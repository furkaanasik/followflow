import { Stack } from 'expo-router';

import { useTheme } from '@/theme';

// Android + Fabric unmounts screen content before the pop transition starts
// (react-native-screens #1685), so back navigation is done as a forward push
// instead: the previous route is pushed with `back: '1'`, which flips the
// slide direction here.
function directionalSlide({ route }: { route: { params?: object } }) {
  const isBack = Boolean((route.params as { back?: string } | undefined)?.back);
  return {
    animation: isBack
      ? ('slide_from_left' as const)
      : ('slide_from_right' as const),
  };
}

export default function OnboardingLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.bgApp },
      }}
    >
      <Stack.Screen name="income" options={directionalSlide} />
      <Stack.Screen name="recurring" options={directionalSlide} />
      <Stack.Screen name="goal" options={directionalSlide} />
    </Stack>
  );
}
