import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import type { Density, ThemeId } from '../config/themes';

const STORAGE_KEY = 'app-theme';

interface ThemeState {
  themeId: ThemeId;
  density: Density;
  setTheme: (id: ThemeId) => void;
  setDensity: (d: Density) => void;
}

// System preference as the initial default
function getDefaultTheme(): ThemeId {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  themeId: getDefaultTheme(),
  density: 'comfortable',
  setTheme: (themeId) => {
    set({ themeId });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ themeId, density: get().density }));
  },
  setDensity: (density) => {
    set({ density });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ themeId: get().themeId, density }));
  },
}));

// Override with saved preference if one exists
AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.themeId && parsed.density) {
        useThemeStore.setState({ themeId: parsed.themeId, density: parsed.density });
      }
    } catch {}
  }
});
