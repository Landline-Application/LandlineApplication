import { DensityScale, THEMES, type Density } from '@/config/themes';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DevSettings } from 'react-native';

const THEME_KEY = '@app_theme_preference';
const DENSITY_KEY = '@app_density_preference';

interface ThemeContextType {
  isDark: boolean;
  isHydrated: boolean;
  themeId: string;
  density: Density;
  toggleTheme: () => void;
  setDarkMode: (isDark: boolean) => void;
  setTheme: (id: string) => void;
  setDensity: (d: Density) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  isHydrated: false,
  themeId: 'light',
  density: 'comfortable',
  toggleTheme: () => {},
  setDarkMode: () => {},
  setTheme: () => {},
  setDensity: () => {},
});

function reloadAppForThemeChange() {
  if (__DEV__) {
    DevSettings.reload();
  } else {
    console.log('Theme changed. Restart app to fully apply static styles.');
  }
}

export function ThemeContextProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeId] = useState(systemScheme === 'dark' ? 'dark' : 'light');
  const [density, setDensityState] = useState<Density>('comfortable');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([THEME_KEY, DENSITY_KEY])
      .then(([[, storedTheme], [, storedDensity]]) => {
        if (storedTheme && THEMES[storedTheme]) setThemeId(storedTheme);
        if (storedDensity && DensityScale[storedDensity as Density]) setDensityState(storedDensity as Density);
      })
      .finally(() => setIsHydrated(true));
  }, []);

  const isDark = THEMES[themeId]?.isDark ?? false;

  const setTheme = useCallback((id: string) => {
    if (!THEMES[id]) return;
    setThemeId(id);
    AsyncStorage.setItem(THEME_KEY, id).catch((e) => console.warn('Failed to persist theme:', e));
    setTimeout(() => reloadAppForThemeChange(), 180);
  }, []);

  const setDensity = useCallback((d: Density) => {
    setDensityState(d);
    AsyncStorage.setItem(DENSITY_KEY, d).catch((e) => console.warn('Failed to persist density:', e));
    setTimeout(() => reloadAppForThemeChange(), 180);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(themeId === 'dark' ? 'light' : 'dark');
  }, [themeId, setTheme]);

  const setDarkMode = useCallback((nextIsDark: boolean) => {
    setTheme(nextIsDark ? 'dark' : 'light');
  }, [setTheme]);

  const value = useMemo(
    () => ({ isDark, isHydrated, themeId, density, toggleTheme, setDarkMode, setTheme, setDensity }),
    [isDark, isHydrated, themeId, density, toggleTheme, setDarkMode, setTheme, setDensity]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
