import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

import i18n, { getDeviceLanguage, isLanguage, type Language } from '@/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/languageSlice';

const LANGUAGE_STORAGE_KEY = '@followflow/language';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useAppSelector((state) => state.language.language);
  const dispatch = useAppDispatch();
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((stored) => {
        // Stored preference wins; otherwise adopt the device language so
        // Redux matches what i18n was initialized with.
        dispatch(
          setLanguage(isLanguage(stored) ? stored : getDeviceLanguage()),
        );
      })
      .catch(() => {
        // Storage unavailable — keep the device-detected language.
      })
      .finally(() => {
        hydrated.current = true;
      });
  }, [dispatch]);

  useEffect(() => {
    if (i18n.resolvedLanguage !== language)
      i18n.changeLanguage(language).catch(() => {
        // Resources are bundled — a failure here leaves the previous language active.
      });
    if (!hydrated.current) return;
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch(() => {
      // Write failure is non-fatal — language still works in-memory.
    });
  }, [language]);

  const setLang = useCallback(
    (next: Language) => dispatch(setLanguage(next)),
    [dispatch],
  );

  const value = useMemo(
    () => ({ language, setLanguage: setLang }),
    [language, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx)
    throw new Error(
      'useLanguage must be used within a LanguageProvider — check your component tree.',
    );
  return ctx;
}
