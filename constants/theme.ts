/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Landline-specific colors for dark mode
export const LandlineColors = {
  dark: {
    // Main backgrounds
    background: '#0F0F0F',
    surface: '#1A1A1A',
    card: '#1F1F1F',

    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textMuted: '#8E8E8E',

    // Accent colors (blue theme from design)
    primary: '#2563EB', // Blue
    primaryDark: '#1D4ED8',
    accent: '#3B82F6',

    // Status colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    danger: '#DC2626',

    // Notification type colors
    instagram: '#E4405F', // Instagram pink/purple
    messages: '#007AFF', // iMessage blue
    calls: '#34C759', // Green for calls
    voicemail: '#FF9500', // Orange for voicemail
    youtube: '#FF0000', // YouTube red
    apps: '#8E8E93', // Gray for other apps

    // UI elements
    border: '#333333',
    divider: '#2A2A2A',
    buttonDisabled: '#404040',

    // Emergency/access colors
    emergency: '#EF4444',
    emergencyBackground: '#7F1D1D',
  }
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: LandlineColors.dark.text,
    background: LandlineColors.dark.background,
    tint: tintColorDark,
    icon: LandlineColors.dark.textSecondary,
    tabIconDefault: LandlineColors.dark.textSecondary,
    tabIconSelected: tintColorDark,
    // Landline-specific overrides
    surface: LandlineColors.dark.surface,
    card: LandlineColors.dark.card,
    primary: LandlineColors.dark.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
