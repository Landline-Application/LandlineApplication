import { useEffect, useState } from 'react';

import { LogBox, Text } from 'react-native';

import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { hasAcceptedTerms } from '@/utils/acceptance-storage';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

LogBox.ignoreLogs(['Unable to activate keep awake']);

SplashScreen.preventAutoHideAsync();

// Set Inter as the default font for all Text components app-wide.
// Individual styles can still override with a specific fontFamily.
(Text as any).defaultProps = (Text as any).defaultProps ?? {};
(Text as any).defaultProps.style = { fontFamily: 'Inter_400Regular' };

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;

    // Initialize Landline Mode store from native state
    const { checkStatus } = useLandlineStore.getState();
    checkStatus();
    setIsReady(true);
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isReady) return;

    async function handleNavigation() {
      // Re-check acceptance status to ensure we have the latest value
      const accepted = await hasAcceptedTerms();
      const currentScreen = segments[0] as string;
      const isOnTermsScreen = currentScreen === 'terms-and-privacy';

      if (!accepted && !isOnTermsScreen) {
        // User hasn't accepted terms, redirect to terms screen
        router.replace('/terms-and-privacy');
      } else if (accepted && isOnTermsScreen) {
        // User has accepted but is on terms screen, redirect to onboarding
        router.replace('/onboarding');
      }
    }

    handleNavigation();
  }, [isReady, segments, router]);

  if (!isReady) {
    // Return null while fonts are loading
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="app-selection" options={{ headerShown: false }} />
            <Stack.Screen name="create-account" options={{ headerShown: false }} />
            <Stack.Screen name="create-account-email" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password-confirm" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="login-email" options={{ headerShown: false }} />
            <Stack.Screen name="notification-detail" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="permissions" options={{ headerShown: false }} />
            <Stack.Screen name="terms-and-privacy" options={{ headerShown: false }} />
            <Stack.Screen name="verify-phone" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
