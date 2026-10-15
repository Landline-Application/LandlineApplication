import { THEMES } from '@/config/themes';
import { useAppTheme } from '@/contexts/theme-context';

export function useThemeTokens() {
  const { themeId, density: densityId } = useAppTheme();
  const theme = THEMES[themeId] ?? THEMES.light;
  const density = theme.density[densityId];
  return { theme, density, themeId, densityId, isEasy: themeId === 'easy' };
}