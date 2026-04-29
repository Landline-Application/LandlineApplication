import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DevSettings } from 'react-native';

const THEME_KEY = '@app_theme_preference';

interface ThemeContextType {
  isDark: boolean;
  isHydrated: boolean;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  isHydrated: false,
  toggleTheme: () => {},
  setDarkMode: () => {},
});

function reloadAppForThemeChange() {
  if (__DEV__) {
    DevSettings.reload();
  } else {
    // In production we avoid hard-failing if a reload API is unavailable.
    // Theme still persists and applies on next launch.
    console.log('Theme changed. Restart app to fully apply static styles.');
  }
}

function persistThemePreference(nextIsDark: boolean) {
  return AsyncStorage.setItem(THEME_KEY, nextIsDark ? 'dark' : 'light');
}

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((stored) => {
        if (stored !== null) {
          setIsDark(stored === 'dark');
        }
      })
      .finally(() => {
        setIsHydrated(true);
      });
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      void persistThemePreference(next)
        .catch((error) => {
          console.warn('Failed to persist theme preference:', error);
        })
        .finally(() => {
          setTimeout(() => {
            reloadAppForThemeChange();
          }, 180);
        });
      return next;
    });
  }, []);

  const setDarkMode = useCallback((nextIsDark: boolean) => {
    if (nextIsDark === isDark) return;
    setIsDark(nextIsDark);
    void persistThemePreference(nextIsDark)
      .catch((error) => {
        console.warn('Failed to persist theme preference:', error);
      })
      .finally(() => {
        // Most screens build StyleSheet tokens at module load.
        // Reloading ensures the entire UI rehydrates with the selected palette.
        setTimeout(() => {
          reloadAppForThemeChange();
        }, 180);
      });
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, isHydrated, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
