import {
  Geist_400Regular,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';

import '@/i18n';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { supabase } from '@/lib/supabase';
import { api, AUTH_INVALID_CODE, useGetProfileQuery } from '@/store/api';
import { useAppSelector } from '@/store/hooks';
import { setBootstrapped } from '@/store/slices/appSlice';
import { setSession } from '@/store/slices/authSlice';
import { resetOnboardingDrafts } from '@/store/slices/onboardingSlice';
import { store } from '@/store/store';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const theme = useTheme();
  const { t } = useTranslation();
  const bootstrapped = useAppSelector((s) => s.app.bootstrapped);
  const status = useAppSelector((s) => s.auth.status);
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useGetProfileQuery(undefined, { skip: status !== 'authenticated' });

  const authInvalid =
    (profileError as { code?: string } | undefined)?.code === AUTH_INVALID_CODE;

  useEffect(() => {
    if (bootstrapped && (status !== 'authenticated' || !profileLoading)) {
      SplashScreen.hideAsync();
    }
  }, [bootstrapped, status, profileLoading]);

  // A stored session whose user/profile no longer exists (e.g. deleted from
  // the dashboard) satisfies none of the route guards below — without this
  // sign-out the app would render a blank screen forever. Transient network
  // failures must NOT sign the user out, so only the AUTH_INVALID_CODE error
  // from the profile query triggers it.
  useEffect(() => {
    if (status === 'authenticated' && !profileLoading && authInvalid) {
      supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    }
  }, [status, profileLoading, authInvalid]);

  // Rendering null here flashes white after sign-in/sign-up (the splash
  // screen only covers the cold start), so show an app-colored loader instead.
  if (!bootstrapped || (status === 'authenticated' && profileLoading))
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.bgApp,
        }}
      >
        <ActivityIndicator color={theme.colors.accentTeal} />
      </View>
    );

  if (status === 'authenticated' && profileError && !authInvalid) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.bgApp,
          padding: 24,
          gap: 12,
        }}
      >
        <Text
          style={{
            fontFamily: theme.fonts.body.medium,
            fontSize: 14,
            lineHeight: 20,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}
        >
          {t('common.connectionError')}
        </Text>
        <Pressable onPress={() => refetchProfile()} hitSlop={8}>
          <Text
            style={{
              fontFamily: theme.fonts.body.semibold,
              fontSize: 14,
              color: theme.colors.accentTeal,
            }}
          >
            {t('common.retry')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: theme.colors.bgApp },
      }}
    >
      <Stack.Protected guard={status !== 'authenticated'}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected
        guard={
          status === 'authenticated' &&
          !!profile &&
          !profile.onboarding_completed
        }
      >
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected
        guard={
          status === 'authenticated' &&
          !!profile &&
          profile.onboarding_completed
        }
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="yeni-islem"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.92],
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgSurface },
          }}
        />
        <Stack.Screen
          name="hedef/[id]"
          options={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgApp },
          }}
        />
        <Stack.Screen
          name="yeni-butce"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.85],
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgSurface },
          }}
        />
        <Stack.Screen
          name="yeni-hedef"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.92],
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgSurface },
          }}
        />
        <Stack.Screen
          name="hedef-para-ekle"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.6],
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgSurface },
          }}
        />
        <Stack.Screen
          name="gelir-kaynaklarim"
          options={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgApp },
          }}
        />
        <Stack.Screen
          name="tekrarlayan-odemeler"
          options={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgApp },
          }}
        />
        <Stack.Screen
          name="yeni-gelir"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.85],
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgSurface },
          }}
        />
        <Stack.Screen
          name="yeni-tekrarlayan"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.85],
            sheetGrabberVisible: true,
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.bgSurface },
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_600SemiBold,
    Geist_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      store.dispatch(setSession(session));
      store.dispatch(setBootstrapped(true));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      store.dispatch(setSession(session));
      // On sign-out, drop all cached query results (a stale AUTH_INVALID
      // error would instantly kill the next sign-in) and clear onboarding
      // drafts so nothing leaks into the next account.
      if (!session) {
        store.dispatch(api.util.resetApiState());
        store.dispatch(resetOnboardingDrafts());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <ThemeProvider>
          <LanguageProvider>
            <RootNavigator />
          </LanguageProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
