import '@/services/landline-reminder-task';

import { useEffect, useRef, useState } from 'react';

import { LogBox, Platform, Text } from 'react-native';

import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useAppState } from '@/hooks/use-app-state';
import { useAutoReplyStore } from '@/hooks/use-auto-reply-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { initLandlineReminderSubsystem } from '@/services/landline-mode-reminder';
import { initializeRetentionSettings, runCleanupIfNeeded } from '@/services/notification-retention';
import { hasCompletedOnboarding, migrateFromOldAcceptance } from '@/utils/onboarding-storage';
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_800ExtraBold,
} from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DarkTheme, DefaultTheme, type Theme, ThemeProvider } from '@react-navigation/native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.surface.card,
    text: COLORS.text.primary,
    border: COLORS.border,
    notification: COLORS.secondary,
  },
};

const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: COLORS.dark.primary,
    background: COLORS.dark.background,
    card: COLORS.dark.card,
    text: COLORS.dark.text.primary,
    border: COLORS.dark.border,
  },
};

LogBox.ignoreLogs(['Unable to activate keep awake']);

SplashScreen.preventAutoHideAsync();

(Text as any).defaultProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps.style = { fontFamily: 'Inter_400Regular' };

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_800ExtraBold,
    ...MaterialIcons.font,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? darkTheme : lightTheme}>
          <NavigationGate />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Startup routing: incomplete onboarding → setup walkthrough; completed → main app.
// If the user is already inside (onboarding) routes, we do not redirect away until
// completion is checked. Completed users who land on onboarding are sent to tabs.
function NavigationGate() {
  const [isReady, setIsReady] = useState(false);
  const { isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const appState = useAppState();

  // Track whether the one-time startup routing decision has been made.
  // Using a ref so it survives re-renders without re-triggering the effect.
  const initialRouteDone = useRef(false);

  useEffect(() => {
    async function initialize() {
      try {
        await migrateFromOldAcceptance();

        // Initialize retention settings (sets defaults for fresh installs)
        await initializeRetentionSettings();

        if (Platform.OS === 'android') {
          await initLandlineReminderSubsystem();
        }

        const { checkStatus } = useLandlineStore.getState();
        await checkStatus();

        // Centralized auto-reply status check (Android only) — eliminates per-screen checks
        if (Platform.OS === 'android') {
          useAutoReplyStore.getState().checkStatus();
        }

        // Run notification cleanup if needed (after checkStatus so notifications are loaded)
        const result = await runCleanupIfNeeded();
        if (result.cleaned) {
          console.log(
            `Notification cleanup completed: ${result.deletedCount} notifications deleted`,
          );
          // Refresh notifications to reflect cleanup
          await useLandlineStore.getState().refreshNotifications();
        }
      } catch (error) {
        console.error('Initialization failed:', error);
      } finally {
        setIsReady(true);
      }
    }
    initialize();
  }, []);

  useEffect(() => {
    if (appState === 'active' && isReady) {
      useLandlineStore.getState().checkStatus();

      // Centralized auto-reply status refresh on foreground (Android only)
      if (Platform.OS === 'android') {
        useAutoReplyStore.getState().checkStatus();
      }

      // Check for notification cleanup when app comes to foreground
      // This handles the case where the retention period passed while app was in background
      runCleanupIfNeeded().then((result) => {
        if (result.cleaned) {
          console.log(
            `Notification cleanup on resume: ${result.deletedCount} notifications deleted`,
          );
          useLandlineStore.getState().refreshNotifications();
        }
      });
    }
  }, [appState, isReady]);

  // Hide splash screen only when everything is ready
  useEffect(() => {
    if (isReady && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [isReady, isAuthLoading]);

  // Runs once after isReady and isAuthLoading — decides where to start and then never runs again.
  useEffect(() => {
    if (!isReady || isAuthLoading || initialRouteDone.current) return;

    async function routeOnStartup() {
      initialRouteDone.current = true;

      const completed = await hasCompletedOnboarding();
      const group = segments[0] as string | undefined;
      const inOnboarding = group === '(onboarding)';

      if (!completed) {
        if (!inOnboarding) {
          router.replace('/setup-walkthrough' as Href);
        }
      } else if (inOnboarding) {
        router.replace('/(tabs)' as Href);
      }
    }

    routeOnStartup();
  }, [isReady, isAuthLoading, segments, router]);

  if (!isReady || isAuthLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(settings)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="guided_setup" options={{ headerShown: false }} />
      <Stack.Screen name="notification-detail" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="debug/tools" options={{ headerShown: false }} />
      <Stack.Screen name="debug/landline" options={{ headerShown: false }} />
    </Stack>
  );
}
