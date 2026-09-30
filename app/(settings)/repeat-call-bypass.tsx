import React, { useCallback, useState } from 'react';

import {
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import {
  SettingsDescriptionCard,
  SettingsPageHeader,
} from '@/components/settings/settings-page-header';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import NotificationApiManager from '@/modules/notification-api-manager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WINDOW_PRESETS_MIN = [5, 7, 10, 15] as const;

const D_BG = '#5f5f5f';
const D_SURFACE = '#4a4a4a';
const D_BORDER = '#3a3a3a';
const D_FG = '#FFFFFF';
const D_SOFT = '#E0E0E0';
const D_MUTED = '#A8A8A8';
const D_ACCENT = '#B8C4A8';

export default function RepeatCallBypassScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
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
      <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
        <SettingsPageHeader title="Repeat-call bypass" paddingTop={insets.top} />
        <View style={styles.centerContainer}>
          <MaterialIcons name="phone-android" size={48} color={isDark ? D_MUTED : COLORS.text.muted} />
          <Text style={[styles.unsupportedTitle, isDark && { color: D_FG }]}>Android only</Text>
          <Text style={[styles.unsupportedText, isDark && { color: D_SOFT }]}>
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
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <SettingsPageHeader title="Repeat-call bypass" paddingTop={insets.top} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <SettingsDescriptionCard
            icon="phone-callback"
            title="Repeat-call bypass"
            body="While Landline Mode is on, the first call from a number can stay quiet. A second call within your window can ring through so urgent people can still reach you."
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Breakthrough</Text>
          <View
            style={[
              styles.card,
              isDark && {
                backgroundColor: D_SURFACE,
                borderColor: D_BORDER,
                shadowColor: 'transparent',
                elevation: 0,
              },
            ]}
          >
            <View style={styles.row}>
              <View style={styles.rowText}>
                <Text style={[styles.cardTitle, isDark && { color: D_FG }]}>
                  Allow second call through
                </Text>
                <Text style={[styles.cardSubtitle, isDark && { color: D_SOFT }]}>
                  Relaxes Do Not Disturb call rules briefly after a repeat call, then restores
                  starred-caller-only rules. Uses the same notification-policy access Landline
                  already needs for focus mode.
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
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Time window</Text>
          <Text style={[styles.sectionHint, isDark && { color: D_SOFT }]}>
            Second call must arrive within this many minutes after the first suppressed attempt.
            After that, the timer resets.
          </Text>
          <View style={styles.presetRow}>
            {WINDOW_PRESETS_MIN.map((m) => {
              const selected = windowMinutes === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.presetChip,
                    selected && styles.presetChipSelected,
                    isDark &&
                      !selected && {
                        backgroundColor: D_SURFACE,
                        borderColor: D_BORDER,
                      },
                  ]}
                  onPress={() => onPreset(m)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      selected && styles.presetChipTextSelected,
                      isDark && !selected && { color: D_SOFT },
                    ]}
                  >
                    {m} min
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!WINDOW_PRESETS_MIN.some((m) => m === windowMinutes) && (
            <Text style={[styles.customWindowNote, isDark && { color: D_MUTED }]}>
              Current: {windowMinutes} minutes (custom)
            </Text>
          )}
        </View>

        <View
          style={[
            styles.infoBox,
            isDark && { backgroundColor: D_SURFACE, borderWidth: 1, borderColor: D_BORDER },
          ]}
        >
          <MaterialIcons name="info-outline" size={16} color={isDark ? D_MUTED : COLORS.text.muted} />
          <Text style={[styles.infoText, isDark && { color: D_MUTED }]}>
            Private, unknown, or withheld caller IDs often do not include enough digits to match a
            second call to the first—we cannot bypass in those cases. Rapid hang-up and redial
            usually still counts as two attempts if each posts a new call notification.
          </Text>
        </View>

        <View style={{ height: Spacing.jumbo }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  sectionHint: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  rowText: { flex: 1 },
  cardTitle: {
    fontSize: 16,
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
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
    backgroundColor: `${COLORS.primary}15`,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 17,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  unsupportedTitle: {
    marginTop: Spacing.md,
    fontSize: 20,
    fontFamily: 'Fraunces_700Bold',
    color: COLORS.foreground,
  },
  unsupportedText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  unsupportedButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
  },
  unsupportedButtonText: {
    color: COLORS.text.onPrimary,
    fontFamily: 'Nunito_700Bold',
    fontSize: 15,
  },
});
