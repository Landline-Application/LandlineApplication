import { useCallback } from 'react';

import { Alert, Button, Platform, StyleSheet } from 'react-native';

import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import Notif from '@/modules/notification-api-manager';

export default function HomeScreen() {
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  // ------------ Notifications demo --------------
  const requestNotifPermissions = useCallback(async () => {
    const already = Notif.hasPostPermission();
    if (already) {
      console.log('Notification permission already granted');
      return;
    }
    console.log('Opening notification settings…');
    // Notif.openNotificationSettings();

    // optional: check again a bit later
    setTimeout(() => {
      console.log('Permission after settings:', Notif.hasPostPermission());
    }, 2000);
  }, []);

  // Send a test notification
  const sendTestNotification = useCallback(() => {
    if (!Notif.hasPostPermission()) {
      Alert.alert('Enable notifications first');
      return;
    }
    // IMPORTANCE_DEFAULT = 3
    Notif.createChannel('demo', 'Demo', 3);
    const id = Date.now() % 100000;
    Notif.notify('Hello', 'It works!', 'demo', id);
  }, []);
  // ------------------------------------------------

  const router = useRouter();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }
    >
      {/* Notification buttons */}
      <Button title="Request Notification Permission" onPress={requestNotifPermissions} />
      <Button title="Send Test Notification" onPress={sendTestNotification} />

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Native Module Tests</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button
            title="Open Auto-Reply Test Page"
            onPress={() => router.push('/auto-reply-test')}
          />
          <Button title="Open DND Test Page" onPress={() => router.push('/dnd-test')} />
          <Button
            title="Open Notification Log Test Page"
            onPress={() => router.push('/notification-log-test')}
          />
        </ThemedView>
        {/* Authentication Status */}
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">👤 Account Status</ThemedText>
          {isAuthenticated ? (
            <ThemedView style={{ gap: 8 }}>
              <ThemedText>
                ✅ Signed in as: <ThemedText type="defaultSemiBold">{user?.email}</ThemedText>
              </ThemedText>
              <Button title="Sign Out" onPress={handleSignOut} color="#f5576c" />
            </ThemedView>
          ) : (
            <ThemedView style={{ gap: 8 }}>
              <ThemedText>❌ Not signed in</ThemedText>
              <Button
                title="🎉 View Onboarding / Sign Up"
                onPress={() => router.push('/onboarding')}
              />
            </ThemedView>
          )}
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  buttonGroup: {
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
