import { useEffect, useRef, useState } from 'react';

import { LogBox, Text } from 'react-native';

import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from '@/constants/theme';
import { AuthProvider } from '@/contexts/auth-context';
import { useAppState } from '@/hooks/use-app-state';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLandlineStore } from '@/hooks/use-landline-store';
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

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

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

// Handles the single startup routing decision: has the user completed onboarding?
// After that initial check it steps aside — all further navigation is imperative
// (router.replace / router.push at the call site). Auth is not required to use
// the app, so sign-out never triggers a redirect here.
function NavigationGate() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const appState = useAppState();

  // Track whether the one-time startup routing decision has been made.
  // Using a ref so it survives re-renders without re-triggering the effect.
  const initialRouteDone = useRef(false);

  useEffect(() => {
    async function initialize() {
      await migrateFromOldAcceptance();
      const { checkStatus } = useLandlineStore.getState();
      await checkStatus();
      setIsReady(true);
    }
    initialize();
  }, []);

  useEffect(() => {
    if (appState === 'active' && isReady) {
      useLandlineStore.getState().checkStatus();
    }
  }, [appState, isReady]);

  // Runs once after isReady — decides where to start and then never runs again.
  useEffect(() => {
    if (!isReady || initialRouteDone.current) return;

    async function routeOnStartup() {
      initialRouteDone.current = true;

      const completed = await hasCompletedOnboarding();
      const isOnOnboardingScreen = segments[0] === '(onboarding)';

      if (!completed && !isOnOnboardingScreen) {
        router.replace('/onboarding');
      } else if (completed && isOnOnboardingScreen) {
        router.replace('/(tabs)');
      }
    }

    routeOnStartup();
  }, [isReady, segments, router]);

  if (!isReady) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
      <Stack.Screen name="(settings)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="notification-detail" options={{ headerShown: false }} />
    </Stack>
  );
}
