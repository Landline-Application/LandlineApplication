import { themes } from '../config/themes';
import { useThemeStore } from '../stores/theme';

export function useTheme() {
  const { themeId, density } = useThemeStore();
  const theme = themes[themeId];
  return { theme, density: theme.density[density], themeId, densityId: density };
}
