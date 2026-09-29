import React, { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { getAllInstalledApps } from '@/modules/dnd-manager';
import NotificationApiManager, { type LaunchableApp } from '@/modules/notification-api-manager';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const D_BG = '#5f5f5f';
const D_SURFACE = '#4a4a4a';
const D_BORDER = '#3a3a3a';
const D_FG = '#FFFFFF';
const D_SOFT = '#E0E0E0';
const D_MUTED = '#A8A8A8';
const D_ACCENT = '#B8C4A8';
const USER_FACING_SYSTEM_PACKAGES = new Set([
  'com.google.android.apps.messaging',
  'com.google.android.dialer',
  'com.android.dialer',
  'com.google.android.contacts',
  'com.android.contacts',
  'com.google.android.gm',
  'com.android.chrome',
  'com.google.android.youtube',
  'com.google.android.apps.maps',
  'com.google.android.apps.photos',
  'com.google.android.calendar',
  'com.google.android.deskclock',
  'com.google.android.apps.docs',
  'com.android.vending',
  'com.google.android.googlequicksearchbox',
]);

function isUserFacingApp(app: {
  packageName: string;
  appName: string;
  isSystemApp?: boolean;
}): boolean {
  if (USER_FACING_SYSTEM_PACKAGES.has(app.packageName)) return true;
  if (app.isSystemApp) return false;
  const pkg = app.packageName;
  if (pkg === 'android' || pkg.startsWith('com.android.') || pkg.includes('.providers.')) {
    return false;
  }
  if (/storage|library|webview|easter egg|ad privacy|accessibility/i.test(app.appName)) {
    return false;
  }
  return true;
}

export default function LoggedAppsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [apps, setApps] = useState<LaunchableApp[]>([]);
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setLoading(false);
      return;
    }
    try {
      let listed: LaunchableApp[] = [];
      try {
        listed = await NotificationApiManager.getLaunchableApps();
      } catch (error) {
        console.warn('getLaunchableApps failed, falling back to installed apps', error);
      }
      if (listed.length === 0) {
        const installed = await getAllInstalledApps(true);
        listed = installed
          .filter(isUserFacingApp)
          .map((app) => ({
            packageName: app.packageName,
            appName: app.appName,
          }));
      }
      const blockedList = NotificationApiManager.getBlockedLogPackages();
      setApps(listed);
      setBlocked(new Set(blockedList));
    } catch (error) {
      console.error('Failed to load logged-apps settings', error);
      Alert.alert('Could not load apps', 'Try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const persistBlocked = useCallback((next: Set<string>) => {
    NotificationApiManager.setBlockedLogPackages([...next]);
  }, []);

  const onToggle = useCallback(
    (packageName: string, enabled: boolean) => {
      if (Platform.OS !== 'android') return;
      haptics.light();
      setBlocked((prev) => {
        const next = new Set(prev);
        if (enabled) {
          next.delete(packageName);
        } else {
          next.add(packageName);
        }
        persistBlocked(next);
        return next;
      });
    },
    [persistBlocked],
  );

  const onLogAll = useCallback(() => {
    if (Platform.OS !== 'android') return;
    haptics.light();
    persistBlocked(new Set());
    setBlocked(new Set());
  }, [persistBlocked]);

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter(
      (app) => app.appName.toLowerCase().includes(q) || app.packageName.toLowerCase().includes(q),
    );
  }, [apps, search]);

  const loggedCount =
    apps.length - [...blocked].filter((pkg) => apps.some((a) => a.packageName === pkg)).length;
  const loggingAll = blocked.size === 0;

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Logged apps</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="phone-android" size={48} color={COLORS.text.muted} />
          <Text style={styles.unsupportedTitle}>Android only</Text>
          <Text style={styles.unsupportedText}>
            Choosing which apps appear in the notification log uses Android’s installed-app list.
          </Text>
          <TouchableOpacity style={styles.unsupportedButton} onPress={() => router.back()}>
            <Text style={styles.unsupportedButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <View
        style={[
          styles.header,
          isDark && { backgroundColor: D_BG, borderBottomColor: D_BORDER },
          { paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={isDark ? D_FG : COLORS.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, isDark && { color: D_FG }]}>Logged apps</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDark ? D_ACCENT : COLORS.primary} />
          <Text style={[styles.loadingText, isDark && { color: D_SOFT }]}>Loading apps…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApps}
          keyExtractor={(item) => item.packageName}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <View
                style={[
                  styles.descriptionCard,
                  isDark && {
                    backgroundColor: 'rgba(93, 112, 82, 0.18)',
                    borderColor: 'rgba(184, 196, 168, 0.35)',
                  },
                ]}
              >
                <MaterialIcons
                  name="notifications"
                  size={20}
                  color={isDark ? D_ACCENT : COLORS.primary}
                />
                <View style={styles.descriptionTextContainer}>
                  <Text style={[styles.descriptionTitle, isDark && { color: D_FG }]}>
                    {loggingAll
                      ? 'Logging all apps'
                      : `Logging ${Math.max(0, loggedCount)} of ${apps.length} apps`}
                  </Text>
                  <Text style={[styles.descriptionText, isDark && { color: D_SOFT }]}>
                    Notifications from these apps are saved in your log during Landline Mode. Turn
                    an app off to stop logging it. This list is kept even if you clear the log.
                  </Text>
                </View>
              </View>

              {!loggingAll && (
                <TouchableOpacity
                  style={[
                    styles.logAllButton,
                    isDark && { backgroundColor: 'rgba(93, 112, 82, 0.15)', borderColor: D_ACCENT },
                  ]}
                  onPress={onLogAll}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name="done-all"
                    size={20}
                    color={isDark ? D_ACCENT : COLORS.primary}
                  />
                  <Text style={[styles.logAllButtonText, isDark && { color: D_ACCENT }]}>
                    Log all apps
                  </Text>
                </TouchableOpacity>
              )}

              <View
                style={[
                  styles.searchRow,
                  isDark && { backgroundColor: D_SURFACE, borderColor: D_BORDER },
                ]}
              >
                <MaterialIcons
                  name="search"
                  size={20}
                  color={isDark ? D_MUTED : COLORS.text.muted}
                />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search apps"
                  placeholderTextColor={isDark ? D_MUTED : COLORS.text.muted}
                  style={[styles.searchInput, isDark && { color: D_FG }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, isDark && { color: D_MUTED }]}>
              {search.trim() ? 'No apps match that search.' : 'No installed apps found.'}
            </Text>
          }
          renderItem={({ item }) => {
            const enabled = !blocked.has(item.packageName);
            return (
              <View
                style={[
                  styles.appRow,
                  isDark && { backgroundColor: D_SURFACE, borderColor: D_BORDER },
                ]}
              >
                <View style={styles.appRowText}>
                  <Text style={[styles.appName, isDark && { color: D_FG }]} numberOfLines={1}>
                    {item.appName}
                  </Text>
                  <Text style={[styles.appPackage, isDark && { color: D_MUTED }]} numberOfLines={1}>
                    {item.packageName}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={(value) => onToggle(item.packageName, value)}
                  trackColor={{ false: isDark ? D_BORDER : COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.background}
                />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
  },
  headerSpacer: { width: 40 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
  },
  unsupportedTitle: {
    marginTop: Spacing.md,
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: COLORS.foreground,
  },
  unsupportedText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
  },
  unsupportedButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
  },
  unsupportedButtonText: {
    color: COLORS.text.onPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  descriptionCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: COLORS.muted,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: Spacing.md,
  },
  descriptionTextContainer: { flex: 1 },
  descriptionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: COLORS.foreground,
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 19,
  },
  logAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.muted,
  },
  logAllButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: COLORS.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.card,
  },
  appRowText: { flex: 1 },
  appName: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.foreground,
  },
  appPackage: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: COLORS.text.muted,
  },
  emptyText: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
  },
});
