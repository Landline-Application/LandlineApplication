import React, { useCallback, useState } from 'react';

import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WINDOW_PRESETS_MIN = [5, 7, 10, 15] as const;

export default function RepeatCallBypassScreen() {
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState(true);
  const [windowMs, setWindowMs] = useState(7 * 60 * 1000);

  const load = useCallback(() => {
    if (Platform.OS !== 'android') return;
    setEnabled(NotificationApiManager.isRepeatCallBypassEnabled());
    setWindowMs(NotificationApiManager.getRepeatCallBypassWindowMs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onToggle = (value: boolean) => {
    if (Platform.OS !== 'android') return;
    setEnabled(value);
    NotificationApiManager.setRepeatCallBypassEnabled(value);
  };

  const onPreset = (minutes: number) => {
    if (Platform.OS !== 'android') return;
    const ms = minutes * 60 * 1000;
    setWindowMs(ms);
    NotificationApiManager.setRepeatCallBypassWindowMs(ms);
  };

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
            <Text style={styles.headerTitle}>Repeat-call bypass</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContainer}>
          <MaterialIcons name="phone-android" size={48} color={COLORS.text.muted} />
          <Text style={styles.unsupportedTitle}>Android only</Text>
          <Text style={styles.unsupportedText}>
            Second-call breakthrough uses Android incoming-call notifications. It is not available on
            this platform.
          </Text>
          <TouchableOpacity style={styles.unsupportedButton} onPress={() => router.back()}>
            <Text style={styles.unsupportedButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const windowMinutes = Math.round(windowMs / 60000);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Repeat-call bypass</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.cardTitle}>Allow second call through</Text>
              <Text style={styles.cardSubtitle}>
                While Landline Mode is on, the first incoming call from a number can be hidden from the
                shade. If they call again within your time window, the next call can ring through: we
                also relax Do Not Disturb call rules briefly (about three minutes), then restore
                starred-caller-only calls automatically. Requires the same notification-policy access
                Landline already uses for focus mode.
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={onToggle}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Time window</Text>
        <Text style={styles.sectionHint}>
          Second call must arrive within this many minutes after the first suppressed attempt. After
          that, the timer resets.
        </Text>
        <View style={styles.presetRow}>
          {WINDOW_PRESETS_MIN.map((m) => {
            const selected = windowMinutes === m;
            return (
              <TouchableOpacity
                key={m}
                style={[styles.presetChip, selected && styles.presetChipSelected]}
                onPress={() => onPreset(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.presetChipText, selected && styles.presetChipTextSelected]}>
                  {m} min
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!WINDOW_PRESETS_MIN.some((m) => m === windowMinutes) && (
          <Text style={styles.customWindowNote}>Current: {windowMinutes} minutes (custom)</Text>
        )}

        <View style={styles.notice}>
          <MaterialIcons name="info-outline" size={20} color={COLORS.text.secondary} />
          <Text style={styles.noticeText}>
            Private, unknown, or withheld caller IDs often do not include enough digits to match a
            second call to the first—we cannot bypass in those cases. Rapid hang-up and redial usually
            still counts as two attempts if each posts a new call notification.
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  card: {
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  rowText: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    color: COLORS.foreground,
    fontFamily: 'Nunito_700Bold',
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
  },
  sectionLabel: {
    marginTop: Spacing.xl,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: COLORS.foreground,
  },
  sectionHint: {
    marginTop: Spacing.xs,
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  presetChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  presetChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.muted,
  },
  presetChipText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
  },
  presetChipTextSelected: {
    color: COLORS.primary,
  },
  customWindowNote: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
  },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: COLORS.surface.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 19,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
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
});
