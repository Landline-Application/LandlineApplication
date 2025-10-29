import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { hasAcceptedTerms } from '@/utils/acceptance-storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Simple ready check to ensure app is initialized
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    async function handleNavigation() {
      // Re-check acceptance status to ensure we have the latest value
      const accepted = await hasAcceptedTerms();
      const currentScreen = segments[0] as string;
      const isOnTermsScreen = currentScreen === 'terms-and-privacy';

      if (!accepted && !isOnTermsScreen) {
        // User hasn't accepted terms, redirect to terms screen
        router.replace('/terms-and-privacy' as any);
      } else if (accepted && isOnTermsScreen) {
        // User has accepted but is on terms screen, redirect to onboarding
        router.replace('/onboarding');
      }
    }

    handleNavigation();
  }, [isReady, segments, router]);

  if (!isReady) {
    // Return null while checking acceptance status
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="terms-and-privacy" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="notification-detail" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
