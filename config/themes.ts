export type Density = 'compact' | 'comfortable' | 'spacious';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  primaryText: string;
  text: string;
  muted: string;
  border: string;
  danger: string;
  success: string;
}

export interface Theme {
  id: string;
  label: string;
  isDark: boolean;
  colors: ThemeColors;
  fonts: { regular: string; medium: string; bold: string };
  density: Record<Density, { padding: number; gap: number; fontSize: number; borderRadius: number; minTouch: number }>;
}

const baseLayout = {
  compact: { padding: 8, gap: 6, fontSize: 13, borderRadius: 8, minTouch: 40 },
  comfortable: { padding: 12, gap: 10, fontSize: 15, borderRadius: 10, minTouch: 48 },
  spacious: { padding: 16, gap: 14, fontSize: 17, borderRadius: 12, minTouch: 56 },
};

export const themes: Record<string, Theme> = {
  light: {
    id: 'light',
    label: 'Light',
    isDark: false,
    colors: { background: '#F7F7F8', surface: '#FFFFFF', primary: '#2563EB', primaryText: '#FFFFFF', text: '#111827', muted: '#6B7280', border: '#E5E7EB', danger: '#DC2626', success: '#16A34A' },
    fonts: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', bold: 'Inter_700Bold' },
    density: baseLayout,
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    isDark: true,
    colors: { background: '#0B0F19', surface: '#151A26', primary: '#3B82F6', primaryText: '#FFFFFF', text: '#F3F4F6', muted: '#9CA3AF', border: '#2A3140', danger: '#EF4444', success: '#22C55E' },
    fonts: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', bold: 'Inter_700Bold' },
    density: baseLayout,
  },
  easy: {
    id: 'easy',
    label: 'Easy Mode',
    isDark: false,
    colors: { background: '#FFFFFF', surface: '#FFFFFF', primary: '#1A56DB', primaryText: '#FFFFFF', text: '#000000', muted: '#4B5563', border: '#D1D5DB', danger: '#B91C1C', success: '#15803D' },
    fonts: { regular: 'Nunito_400Regular', medium: 'Nunito_600SemiBold', bold: 'Nunito_700Bold' },
    density: {
      compact: { padding: 16, gap: 14, fontSize: 18, borderRadius: 14, minTouch: 56 },
      comfortable: { padding: 18, gap: 16, fontSize: 20, borderRadius: 16, minTouch: 60 },
      spacious: { padding: 22, gap: 18, fontSize: 22, borderRadius: 18, minTouch: 64 },
    },
  },
  school: {
    id: 'school',
    label: 'School',
    isDark: false,
    colors: { background: '#F9FAFB', surface: '#FFFFFF', primary: '#0F766E', primaryText: '#FFFFFF', text: '#111827', muted: '#6B7280', border: '#E5E7EB', danger: '#DC2626', success: '#15803D' },
    fonts: { regular: 'Inter_400Regular', medium: 'Inter_500Medium', bold: 'Inter_700Bold' },
    density: baseLayout,
  },
};

export type ThemeId = keyof typeof themes;
export const THEMES = themes;
export const DensityScale = baseLayout;
