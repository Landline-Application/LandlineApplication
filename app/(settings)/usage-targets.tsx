import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UsageTargetCard } from '@/components/usage-targets/usage-target-card';
import { UsageTargetEditor } from '@/components/usage-targets/usage-target-editor';
import { Button } from '@/components/ui/button';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { useUsageTargetsStore } from '@/hooks/use-usage-targets-store';
import UsageStatsManager, {
  type AppDailyUsage,
  type AppUsageSummary,
} from '@/modules/usage-stats-manager';
import {
  USAGE_HISTORY_DAYS,
  buildTargetProgress,
  normalizeUsageTargets,
  usageTargetsHeaderSubtitle,
  type UsageTargetDraft,
} from '@/utils/usage-targets';

type EditorState = { mode: 'create' | 'edit'; packageName?: string } | null;

function usageLoadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/getDailyAppUsage|not a function|undefined method|not available|UNAVAILABLE/i.test(message)) {
    return 'Daily usage needs a fresh Android build. Rebuild the app, then open this screen again.';
  }
  return 'Failed to load usage for your targets.';
}

export default function UsageTargetsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const storedTargets = useUsageTargetsStore((state) => state.targets);
  const upsertTarget = useUsageTargetsStore((state) => state.upsertTarget);
  const removeTarget = useUsageTargetsStore((state) => state.removeTarget);
  const targets = useMemo(() => normalizeUsageTargets(storedTargets), [storedTargets]);

  const [hasUsagePermission, setHasUsagePermission] = useState(false);
  const [series, setSeries] = useState<AppDailyUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [candidates, setCandidates] = useState<AppUsageSummary[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const focusedRef = useRef(false);
  const requestRef = useRef(0);

  const textPrimary = isDark ? '#FFFFFF' : COLORS.foreground;
  const textSecondary = isDark ? '#F3F3F3' : COLORS.text.secondary;
  const background = isDark ? '#5f5f5f' : COLORS.background;
  const border = isDark ? '#3a3a3a' : COLORS.surface.border;

  const reload = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasLoaded(true);
      return;
    }
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const granted = UsageStatsManager.hasUsageStatsPermission();
    setHasUsagePermission(granted);
    const names = normalizeUsageTargets(useUsageTargetsStore.getState().targets).map(
      (target) => target.packageName,
    );
    if (!granted || names.length === 0) {
      if (requestId !== requestRef.current) return;
      setSeries([]);
      setLoadFailed(false);
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    setLoading(true);
    try {
      const rows = await UsageStatsManager.getDailyAppUsage(names, USAGE_HISTORY_DAYS);
      if (requestId !== requestRef.current) return;
      setSeries(rows);
      setLoadFailed(false);
    } catch (error) {
      if (requestId !== requestRef.current) return;
      console.error('Failed to load usage targets', error);
      setLoadFailed(true);
      if (focusedRef.current) {
        Alert.alert('Usage targets', usageLoadErrorMessage(error));
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
        setHasLoaded(true);
      }
    }
  }, []);

  const targetKey = targets
    .map((target) => `${target.packageName}:${target.dailyLimitMs ?? ''}:${target.weeklyLimitMs ?? ''}`)
    .join('|');
  const skipKeyReload = useRef(true);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      reload();
      return () => {
        focusedRef.current = false;
      };
    }, [reload]),
  );

  useEffect(() => {
    if (skipKeyReload.current) {
      skipKeyReload.current = false;
      return;
    }
    if (!focusedRef.current) return;
    reload();
  }, [reload, targetKey]);

  const seriesByPackage = useMemo(() => {
    return new Map(series.map((row) => [row.packageName, row] as const));
  }, [series]);

  const progressByPackage = useMemo(() => {
    const now = new Date();
    return new Map(
      targets.map((target) => {
        const row = seriesByPackage.get(target.packageName);
        return [target.packageName, buildTargetProgress(row?.days ?? [], now)] as const;
      }),
    );
  }, [seriesByPackage, targets]);

  const usageReady = hasUsagePermission && hasLoaded && !loadFailed;
  const subtitle = usageTargetsHeaderSubtitle(targets, progressByPackage, usageReady);

  const editing = editor?.packageName
    ? (targets.find((target) => target.packageName === editor.packageName) ?? null)
    : null;

  const loadCandidates = useCallback(async () => {
    if (Platform.OS !== 'android') return;
    const granted = UsageStatsManager.hasUsageStatsPermission();
    setHasUsagePermission(granted);
    if (!granted) {
      setCandidates([]);
      return;
    }
    setCandidatesLoading(true);
    try {
      const apps = await UsageStatsManager.getTopUsageApps('30d', 80);
      setCandidates(apps);
    } catch (error) {
      console.error('Failed to load apps for usage targets', error);
      Alert.alert('Usage targets', 'Failed to load apps from the last 30 days.');
    } finally {
      setCandidatesLoading(false);
    }
  }, []);

  function openCreate() {
    setEditor({ mode: 'create' });
    loadCandidates();
  }

  function openEdit(packageName: string) {
    setEditor({ mode: 'edit', packageName });
  }

  async function handleRequestPermission() {
    await UsageStatsManager.openUsageStatsSettings();
    Alert.alert(
      'Grant usage access',
      'Turn on usage access for Landline, then come back and refresh. Settings → Apps → Special app access → Usage access → Landline.',
    );
  }

  function handleSave(draft: UsageTargetDraft) {
    upsertTarget(draft);
    setEditor(null);
  }

  function handleDelete(packageName: string) {
    removeTarget(packageName);
    setEditor(null);
  }

  const unavailableNote = !hasUsagePermission
    ? 'Grant usage access to see how close you are and the trend over time.'
    : 'Screen time did not load. Pull to refresh.';

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <View style={[styles.header, { paddingTop: insets.top, borderBottomColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color={textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Usage targets</Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>{subtitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {Platform.OS !== 'android' ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>Android only</Text>
          <Text style={[styles.emptyBody, { color: textSecondary }]}>
            Usage targets read screen time from Android, so they are available on Android devices.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.jumbo }]}
          refreshControl={
            <RefreshControl
              refreshing={loading && hasLoaded}
              onRefresh={reload}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.intro, { color: textSecondary }]}>
            Pick apps and set a cap for today, this week, or both. Bars show how that time has moved
            over the last two weeks.
          </Text>

          {!hasLoaded ? (
            <ActivityIndicator color={COLORS.primary} style={styles.spinner} />
          ) : (
            <>
              {!hasUsagePermission ? (
                <View style={styles.permissionBlock}>
                  <Text style={[styles.emptyBody, { color: textSecondary }]}>
                    Usage access lets Landline read screen time so it can compare each app with your
                    cap.
                  </Text>
                  <Button label="Grant usage access" onPress={handleRequestPermission} variant="ghost" />
                </View>
              ) : null}

              {loadFailed ? (
                <Text style={[styles.emptyBody, { color: textSecondary }]}>
                  Screen time did not load. Pull to refresh after the app has been rebuilt.
                </Text>
              ) : null}

              {targets.length === 0 ? (
                <Text style={[styles.emptyBody, { color: textSecondary }]}>
                  No targets yet. Add an app you want to use less, then set how long is enough for a
                  day or a week.
                </Text>
              ) : (
                targets.map((target) => (
                  <UsageTargetCard
                    key={target.packageName}
                    target={target}
                    progress={usageReady ? (progressByPackage.get(target.packageName) ?? null) : null}
                    iconUri={seriesByPackage.get(target.packageName)?.iconUri}
                    unavailableNote={unavailableNote}
                    onPress={() => openEdit(target.packageName)}
                  />
                ))
              )}

              <Button label="Add an app" onPress={openCreate} fullWidth />
            </>
          )}
        </ScrollView>
      )}

      <UsageTargetEditor
        visible={editor != null}
        mode={editor?.mode ?? 'create'}
        initial={editing}
        initialIconUri={
          editing ? seriesByPackage.get(editing.packageName)?.iconUri : undefined
        }
        candidates={candidates}
        candidatesLoading={candidatesLoading}
        hasUsagePermission={hasUsagePermission}
        targets={targets}
        onClose={() => setEditor(null)}
        onSave={handleSave}
        onDelete={handleDelete}
        onRequestPermission={handleRequestPermission}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Fraunces_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  intro: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  permissionBlock: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  emptyWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.jumbo,
  },
  emptyTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    marginBottom: Spacing.sm,
  },
  emptyBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  spinner: {
    marginVertical: Spacing.xl,
  },
});
