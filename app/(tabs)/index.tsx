import { useCallback } from 'react';

import { Alert, Button, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import Notif from '@/modules/notification-api-manager';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user, isAuthenticated, signOut } = useAuth();
  const { isDark, toggleTheme } = useAppTheme();
  const router = useRouter();

  const theme = isDark ? dark : light;

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

  const requestNotifPermissions = useCallback(async () => {
    const already = Notif.hasPostPermission();
    if (already) {
      console.log('Notification permission already granted');
      return;
    }
    setTimeout(() => {
      console.log('Permission after settings:', Notif.hasPostPermission());
    }, 2000);
  }, []);

  const sendTestNotification = useCallback(() => {
    if (!Notif.hasPostPermission()) {
      Alert.alert('Enable notifications first');
      return;
    }
    Notif.createChannel('demo', 'Demo', 3);
    const id = Date.now() % 100000;
    Notif.notify('Hello', 'It works!', 'demo', id);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
          <View style={styles.themeRow}>
            <Text style={[styles.themeLabel, { color: theme.text }]}>
              {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: '#5B7FE8' }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
          <View style={styles.buttonGroup}>
            <Button title="Request Permission" onPress={requestNotifPermissions} />
            <Button title="Send Test Notification" onPress={sendTestNotification} />
          </View>
        </View>

        {/* Native Module Tests */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Native Module Tests</Text>
          <View style={styles.buttonGroup}>
            <Button title="Auto-Reply Test" onPress={() => router.push('/auto-reply-test')} />
            <Button title="DND Test" onPress={() => router.push('/dnd-test')} />
            <Button
              title="Notification Log Test"
              onPress={() => router.push('/notification-log-test')}
            />
            <Button
              title="Landline Mode Test"
              onPress={() => router.push('/(tabs)/landline-mode-test')}
            />
          </View>
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
          {isAuthenticated ? (
            <View style={styles.authContainer}>
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                Signed in as: {user?.email}
              </Text>
              <Button title="Sign Out" onPress={handleSignOut} color="#f5576c" />
            </View>
          ) : (
            <View style={styles.authContainer}>
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>Not signed in</Text>
              <Button title="Sign Up" onPress={() => router.push('/create-account')} />
            </View>
          )}
        </View>

        {/* Onboarding */}
        <View style={[styles.section, { backgroundColor: theme.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Onboarding</Text>
          <View style={styles.buttonGroup}>
            <Button title="View Onboarding" onPress={() => router.push('/onboarding')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const light = {
  bg: '#f5f5f5',
  cardBg: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#555555',
};

const dark = {
  bg: '#0f0f0f',
  cardBg: '#1e1e1e',
  text: '#f0f0f0',
  textSecondary: '#aaaaaa',
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLabel: {
    fontSize: 15,
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
