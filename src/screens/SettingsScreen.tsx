import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ButtonSecondary } from '@/atoms';
import { useLanguage } from '@/i18n/LanguageProvider';
import { signOut } from '@/lib/auth';
import { InfoRowChevron, SegmentedToggle } from '@/molecules';
import { AppBarSimpleTitle } from '@/organisms';
import { useTheme } from '@/theme';
import type { ThemeMode } from '@/theme/tokens';

export function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      Alert.alert(t('settings.signOutFailed'));
    }
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: theme.colors.bgApp }]}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { gap: theme.spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <AppBarSimpleTitle title={t('settings.title')} />

        <View style={{ gap: theme.spacing.sm }}>
          <Text
            style={{
              fontFamily: theme.fonts.heading.semibold,
              fontSize: 16,
              color: theme.colors.textPrimary,
            }}
          >
            {t('settings.management')}
          </Text>
          <InfoRowChevron
            icon="wallet"
            label={t('settings.incomeSources')}
            value=""
            onPress={() => router.push('/gelir-kaynaklarim')}
          />
          <InfoRowChevron
            icon="repeat"
            label={t('settings.recurringPayments')}
            value=""
            onPress={() => router.push('/tekrarlayan-odemeler')}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text
            style={{
              fontFamily: theme.fonts.heading.semibold,
              fontSize: 16,
              color: theme.colors.textPrimary,
            }}
          >
            {t('settings.appearance')}
          </Text>
          <SegmentedToggle
            options={[
              { label: t('settings.themeDark'), value: 'dark' },
              { label: t('settings.themeLight'), value: 'light' },
              { label: t('settings.themeVibrant'), value: 'vibrant' },
              { label: t('settings.themeVibrantDark'), value: 'vibrant-dark' },
            ]}
            value={theme.mode}
            onChange={(mode) => theme.setMode(mode as ThemeMode)}
          />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text
            style={{
              fontFamily: theme.fonts.heading.semibold,
              fontSize: 16,
              color: theme.colors.textPrimary,
            }}
          >
            {t('settings.language')}
          </Text>
          <SegmentedToggle
            options={[
              { label: 'Türkçe', value: 'tr' },
              { label: 'English', value: 'en' },
            ]}
            value={language}
            onChange={(value) => setLanguage(value as 'tr' | 'en')}
          />
        </View>

        {/* marginTop:auto pins sign-out to the bottom of the tab viewport. */}
        <View style={styles.signOut}>
          <ButtonSecondary
            tone="destructive"
            icon="log-out"
            label={t('settings.signOut')}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  signOut: { marginTop: 'auto' },
});
