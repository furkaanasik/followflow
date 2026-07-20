import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguage } from '@/i18n/LanguageProvider';
import { SegmentedToggle } from '@/molecules';
import { AppBarSimpleTitle } from '@/organisms';
import { useTheme } from '@/theme';

export function SettingsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

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
    paddingBottom: 140,
  },
});
