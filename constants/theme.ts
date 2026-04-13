// ===== FONT CONFIGURATION =====
import { Platform } from 'react-native';

import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

/**
 * Unified Design Token System
 * Organic/Natural Android Design
 * Palette drawn from forest floors, clay pottery, unbleached paper, and river stones.
 */

// ===== COLOR PALETTE =====
export const COLORS = {
  // Primary palette - warm, natural tones
  background: '#FDFCF8',
  foreground: '#2C2C24',
  primary: '#5D7052',
  primaryForeground: '#F3F4F1',
  secondary: '#C18C5D',
  secondaryForeground: '#FFFFFF',
  accent: '#E6DCCD',
  accentForeground: '#4A4A40',
  muted: '#F0EBE5',
  mutedForeground: '#78786C',
  border: '#DED8CF',
  destructive: '#A85448',

  // Semantic colors
  success: '#5D7052',
  error: '#FF3B30',
  warning: '#EA580C',
  info: '#5D7052',

  // Text colors - Standard nested pattern
  text: {
    primary: '#2C2C24',
    secondary: '#6B6B63',
    muted: '#A0A099',
    onPrimary: '#FDFCF8',
    onSecondary: '#FFFFFF',
    onAccent: '#4A4A40',
  },

  // Surface colors
  surface: {
    base: '#FDFCF8',
    elevated: '#F5F3EE',
    card: '#F9F8F5',
    overlay: 'rgba(44, 44, 36, 0.05)',
    border: '#DED8CF', // Consolidated surface.border here
  },

  // Shadow colors (tinted for organic feel)
  shadow: {
    primary: 'rgba(93, 112, 82, 0.12)',
    secondary: 'rgba(193, 140, 93, 0.08)',
    dark: 'rgba(44, 44, 36, 0.15)',
  },

  // Dark mode colors
  dark: {
    background: '#1a1a1a',
    surface: '#242424',
    card: '#2d2d2d',
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      muted: '#808080',
    },
    primary: '#2563eb',
    border: '#3a3a3a',
    divider: '#333333',
    warning: '#ea580c',
    buttonDisabled: '#404040',
    instagram: '#E1306C',
    messages: '#00B4D8',
    calls: '#FF6B6B',
    voicemail: '#4ECDC4',
    youtube: '#FF0000',
    apps: '#A78BFA',
    success: '#34C759',
    error: '#FF3B30',
  },
};

// ===== SPACING SYSTEM (8px grid) =====
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  jumbo: 40,
};

// ===== RADIUS SYSTEM =====
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
  pill: 999,
  card: 32,
  standard: 16,
  cardVariants: [
    {
      borderTopLeftRadius: 48,
      borderTopRightRadius: 32,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 48,
    },
    {
      borderTopLeftRadius: 32,
      borderTopRightRadius: 48,
      borderBottomLeftRadius: 48,
      borderBottomRightRadius: 32,
    },
    {
      borderTopLeftRadius: 40,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 24,
    },
    {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 40,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 40,
    },
  ],
};

// ===== TYPOGRAPHY SCALE =====
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    fontFamily: 'Fraunces',
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    fontFamily: 'Fraunces',
  },
  h3: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
    fontFamily: 'Fraunces',
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
    fontFamily: 'Nunito',
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    fontFamily: 'Nunito',
  },
  bodySm: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    fontFamily: 'Nunito',
  },
  labelLg: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    fontFamily: 'Nunito',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    fontFamily: 'Nunito',
  },
  labelSm: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    fontFamily: 'Nunito',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily: 'Nunito',
  },
  captionSm: {
    fontSize: 10,
    fontWeight: '400' as const,
    lineHeight: 14,
    fontFamily: 'Nunito',
  },
};

// ===== SHADOW SYSTEM =====
export const Shadows = {
  sm: {
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 12,
  },
};

// ===== MOTION & ANIMATION =====
export const Motion = {
  fast: 150,
  normal: 300,
  slow: 500,
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    linear: 'linear',
  },
  scalePress: 0.95,
  scaleHover: 1.02,
  scalePulse: 1.03,
};

// ===== TOUCH TARGETS =====
export const TouchTargets = {
  min: 48,
  sm: 40,
  md: 48,
  lg: 56,
  xl: 64,
};

// Re-export LandlineColors for consistency with existing codebase
export const LandlineColors = {
  dark: COLORS.dark,
};

// Font family names for custom fonts
export const FontFamilies = {
  serif: 'Fraunces',
  sansRounded: 'Nunito',
};

// Initialize custom fonts (call this in app startup, before rendering)
export const initializeFonts = async () => {
  try {
    await SplashScreen.preventAutoHideAsync();

    await Font.loadAsync({
      Fraunces_700Bold: require('@expo-google-fonts/fraunces/Fraunces_700Bold.ttf'),
      Nunito_400Regular: require('@expo-google-fonts/nunito/Nunito_400Regular.ttf'),
      Nunito_600SemiBold: require('@expo-google-fonts/nunito/Nunito_600SemiBold.ttf'),
    });

    await SplashScreen.hideAsync();
  } catch (error) {
    console.warn('Failed to load custom fonts:', error);
  }
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Nunito_400Regular',
    sansMedium: 'Nunito_500Medium',
    sansSemiBold: 'Nunito_600SemiBold',
    sansBold: 'Nunito_700Bold',
    serif: 'Fraunces_600SemiBold',
    serifBold: 'Fraunces_700Bold',
    serifExtraBold: 'Fraunces_800ExtraBold',
    rounded: 'Nunito_400Regular',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
