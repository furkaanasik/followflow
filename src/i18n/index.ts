import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import tr from './locales/tr.json';

export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const FALLBACK_LANGUAGE: Language = 'tr';

export function isLanguage(
  value: string | null | undefined,
): value is Language {
  return (
    value != null && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}

export function getDeviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return isLanguage(code) ? code : FALLBACK_LANGUAGE;
}

// eslint-disable-next-line import/no-named-as-default-member -- canonical i18next init chain
i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en } },
  lng: getDeviceLanguage(),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  defaultNS: 'translation',
  interpolation: { escapeValue: false }, // React escapes already
  react: { useSuspense: false }, // no Suspense boundary around the RN tree
});

export default i18n;
