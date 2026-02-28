import { useEffect, useState } from 'react';

import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/auth-context';
import { ThemeContextProvider, useAppTheme } from '@/contexts/theme-context';
import { hasAcceptedTerms } from '@/utils/acceptance-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function ThemedNavigator() {
  const { isDark } = useAppTheme();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    async function handleNavigation() {
      const accepted = await hasAcceptedTerms();
      const currentScreen = segments[0] as string;
      const isOnTermsScreen = currentScreen === 'terms-and-privacy';

      if (!accepted && !isOnTermsScreen) {
        router.replace('/terms-and-privacy');
      } else if (accepted && isOnTermsScreen) {
        router.replace('/onboarding');
      }
    }

    handleNavigation();
  }, [isReady, segments, router]);

  if (!isReady) return null;

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="terms-and-privacy" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="login-email" options={{ headerShown: false }} />
        <Stack.Screen name="create-account" options={{ headerShown: false }} />
        <Stack.Screen name="create-account-email" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notification-detail" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeContextProvider>
        <AuthProvider>
          <ThemedNavigator />
        </AuthProvider>
      </ThemeContextProvider>
    </SafeAreaProvider>
  );
}
