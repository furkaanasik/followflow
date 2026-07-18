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

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setThemeMode } from '@/store/slices/themeSlice';
import {
  getThemeTokens,
  THEME_MODES,
  type Theme,
  type ThemeMode,
} from '@/theme/tokens';

const THEME_STORAGE_KEY = '@followflow/theme-mode';

interface ThemeContextValue extends Theme {
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function isThemeMode(value: string | null): value is ThemeMode {
  return value !== null && (THEME_MODES as string[]).includes(value);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const mode = useAppSelector((state) => state.theme.mode);
  const dispatch = useAppDispatch();
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (isThemeMode(stored)) dispatch(setThemeMode(stored));
      })
      .catch(() => {
        // Storage unavailable (e.g. private browsing) — keep the default mode.
      })
      .finally(() => {
        hydrated.current = true;
      });
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {
      // Write failure is non-fatal — mode still works in-memory for this session.
    });
  }, [mode]);

  const setMode = useCallback(
    (next: ThemeMode) => dispatch(setThemeMode(next)),
    [dispatch],
  );

  const value = useMemo(
    () => ({ ...getThemeTokens(mode), setMode }),
    [mode, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error(
      'useTheme must be used within a ThemeProvider — check your component tree.',
    );
  return ctx;
}
