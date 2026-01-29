import { useCallback } from 'react';

import { Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import Notif from '@/modules/notification-api-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Notification buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.buttonGroup}>
            <Button title="Request Permission" onPress={requestNotifPermissions} />
            <Button title="Send Test Notification" onPress={sendTestNotification} />
          </View>
        </View>

        {/* Native Module Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Native Module Tests</Text>
          <View style={styles.buttonGroup}>
            <Button title="Auto-Reply Test" onPress={() => router.push('/auto-reply-test')} />
            <Button title="DND Test" onPress={() => router.push('/dnd-test')} />
            <Button
              title="Notification Log Test"
              onPress={() => router.push('/notification-log-test')}
            />
          </View>
        </View>

        {/* Authentication Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          {isAuthenticated ? (
            <View style={styles.authContainer}>
              <Text style={styles.statusText}>Signed in as: {user?.email}</Text>
              <Button title="Sign Out" onPress={handleSignOut} color="#f5576c" />
            </View>
          ) : (
            <View style={styles.authContainer}>
              <Text style={styles.statusText}>Not signed in</Text>
              <Button title="Sign Up" onPress={() => router.push('/create-account')} />
            </View>
          )}
        </View>

        {/* Onboarding */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Onboarding</Text>
          <View style={styles.buttonGroup}>
            <Button title="View Onboarding" onPress={() => router.push('/onboarding')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  section: {
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buttonGroup: {
    gap: 8,
  },
  authContainer: {
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
