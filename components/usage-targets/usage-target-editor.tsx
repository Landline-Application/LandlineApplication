import React, { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppGlyph } from '@/components/usage-targets/app-glyph';
import { Button } from '@/components/ui/button';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing, TouchTargets } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import type { AppUsageSummary } from '@/modules/usage-stats-manager';
import { haptics } from '@/services/haptics';
import {
  MAX_DAILY_TARGET_MS,
  MAX_WEEKLY_TARGET_MS,
  type UsageTarget,
  type UsageTargetDraft,
  clampTargetMinutes,
  defaultDailyLimitMs,
  defaultWeeklyLimitMs,
  formatUsageDuration,
} from '@/utils/usage-targets';

const MINUTE_MS = 60 * 1000;

const DAILY_PRESETS_MINUTES = [30, 60, 120, 180] as const;
const WEEKLY_PRESETS_HOURS = [3, 7, 10, 14] as const;

interface SelectedApp {
  packageName: string;
  appName: string;
  iconUri?: string;
}

interface UsageTargetEditorProps {
  visible: boolean;
  mode: 'create' | 'edit';
  initial: UsageTarget | null;
  initialIconUri?: string;
  candidates: readonly AppUsageSummary[];
  candidatesLoading: boolean;
  hasUsagePermission: boolean;
  targets: readonly UsageTarget[];
  onClose: () => void;
  onSave: (draft: UsageTargetDraft) => void;
  onDelete: (packageName: string) => void;
  onRequestPermission: () => void;
}

function shiftLimit(currentMs: number, deltaMinutes: number, maxMs: number): number {
  return clampTargetMinutes(currentMs + deltaMinutes * MINUTE_MS, maxMs);
}

export function UsageTargetEditor({
  visible,
  mode,
  initial,
  initialIconUri,
  candidates,
  candidatesLoading,
  hasUsagePermission,
  targets,
  onClose,
  onSave,
  onDelete,
  onRequestPermission,
}: UsageTargetEditorProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [step, setStep] = useState<'pick' | 'limits'>('pick');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SelectedApp | null>(null);
  const [dailyOn, setDailyOn] = useState(true);
  const [weeklyOn, setWeeklyOn] = useState(true);
  const [dailyMs, setDailyMs] = useState(defaultDailyLimitMs);
  const [weeklyMs, setWeeklyMs] = useState(defaultWeeklyLimitMs);
  const [createdAt, setCreatedAt] = useState<number | undefined>(undefined);

  const background = isDark ? '#5f5f5f' : COLORS.background;
  const textPrimary = isDark ? '#FFFFFF' : COLORS.foreground;
  const textSecondary = isDark ? '#F3F3F3' : COLORS.text.secondary;
  const textMuted = isDark ? '#E0E0E0' : COLORS.text.muted;
  const surface = isDark ? '#4a4a4a' : COLORS.surface.elevated;
  const border = isDark ? '#3a3a3a' : COLORS.border;

  const sessionKey = visible
    ? `${mode}:${initial?.packageName ?? ''}:${initial?.dailyLimitMs ?? 'off'}:${initial?.weeklyLimitMs ?? 'off'}`
    : 'closed';

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    if (mode === 'edit' && initial) {
      setStep('limits');
      setSelected({
        packageName: initial.packageName,
        appName: initial.appName,
        iconUri: initialIconUri,
      });
      setDailyOn(initial.dailyLimitMs != null);
      setWeeklyOn(initial.weeklyLimitMs != null);
      setDailyMs(initial.dailyLimitMs ?? defaultDailyLimitMs());
      setWeeklyMs(initial.weeklyLimitMs ?? defaultWeeklyLimitMs());
      setCreatedAt(initial.createdAt);
      return;
    }
    if (mode === 'create') {
      setStep('pick');
      setSelected(null);
      setDailyOn(true);
      setWeeklyOn(true);
      setDailyMs(defaultDailyLimitMs());
      setWeeklyMs(defaultWeeklyLimitMs());
      setCreatedAt(undefined);
    }
    // Reset only when the editor opens or the saved cap changes, not when an icon arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionKey]);

  useEffect(() => {
    if (!initialIconUri) return;
    setSelected((current) => {
      if (!current || current.iconUri) return current;
      return { ...current, iconUri: initialIconUri };
    });
  }, [initialIconUri]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return candidates;
    return candidates.filter((app) => {
      return (
        app.appName.toLowerCase().includes(needle) || app.packageName.toLowerCase().includes(needle)
      );
    });
  }, [candidates, query]);

  function applyExisting(app: SelectedApp) {
    const existing = targets.find((target) => target.packageName === app.packageName);
    setSelected(app);
    if (existing) {
      setDailyOn(existing.dailyLimitMs != null);
      setWeeklyOn(existing.weeklyLimitMs != null);
      setDailyMs(existing.dailyLimitMs ?? defaultDailyLimitMs());
      setWeeklyMs(existing.weeklyLimitMs ?? defaultWeeklyLimitMs());
      setCreatedAt(existing.createdAt);
    } else {
      setDailyOn(true);
      setWeeklyOn(true);
      setDailyMs(defaultDailyLimitMs());
      setWeeklyMs(defaultWeeklyLimitMs());
      setCreatedAt(undefined);
    }
    setStep('limits');
  }

  function handleSave() {
    if (!selected || (!dailyOn && !weeklyOn)) return;
    haptics.light();
    onSave({
      packageName: selected.packageName,
      appName: selected.appName,
      iconUri: selected.iconUri,
      dailyLimitMs: dailyOn ? dailyMs : null,
      weeklyLimitMs: weeklyOn ? weeklyMs : null,
      createdAt,
    });
  }

  function handleDelete() {
    if (!selected) return;
    Alert.alert('Remove target', `Remove the cap for ${selected.appName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          haptics.light();
          onDelete(selected.packageName);
        },
      },
    ]);
  }

  const canDelete = selected
    ? targets.some((target) => target.packageName === selected.packageName)
    : false;
  const weeklyUnderDaily = dailyOn && weeklyOn && weeklyMs < dailyMs;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: border }]}>
          <Pressable
            onPress={() => {
              if (step === 'limits' && mode === 'create') {
                setStep('pick');
                return;
              }
              onClose();
            }}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel={step === 'limits' && mode === 'create' ? 'Back to app list' : 'Close'}
          >
            <MaterialIcons
              name={step === 'limits' && mode === 'create' ? 'arrow-back' : 'close'}
              size={24}
              color={textPrimary}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            {step === 'pick' ? 'Choose an app' : 'Set a cap'}
          </Text>
          <View style={styles.headerButton} />
        </View>

        {step === 'pick' ? (
          <View style={styles.pickerBody}>
            {!hasUsagePermission ? (
              <View style={styles.permissionBlock}>
                <Text style={[styles.body, { color: textSecondary }]}>
                  Usage access is needed to pick an app from your screen time.
                </Text>
                <Button label="Grant usage access" onPress={onRequestPermission} variant="ghost" />
              </View>
            ) : (
              <>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search apps"
                  placeholderTextColor={textMuted}
                  style={[
                    styles.search,
                    { color: textPrimary, backgroundColor: surface, borderColor: border },
                  ]}
                  autoCorrect={false}
                  autoCapitalize="none"
                  accessibilityLabel="Search apps"
                />
                {candidatesLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator color={COLORS.primary} />
                  </View>
                ) : (
                  <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.packageName}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
                    ListEmptyComponent={
                      <Text style={[styles.empty, { color: textMuted }]}>
                        {candidates.length === 0
                          ? 'No screen time in the last 30 days yet.'
                          : 'No apps match that search.'}
                      </Text>
                    }
                    renderItem={({ item }) => {
                      const hasTarget = targets.some(
                        (target) => target.packageName === item.packageName,
                      );
                      return (
                        <Pressable
                          style={[styles.appRow, { borderBottomColor: border }]}
                          onPress={() => {
                            haptics.light();
                            applyExisting({
                              packageName: item.packageName,
                              appName: item.appName,
                              iconUri: item.iconUri,
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={
                            hasTarget
                              ? `${item.appName}, target already set`
                              : `Set a target for ${item.appName}`
                          }
                        >
                          <AppGlyph name={item.appName} iconUri={item.iconUri} />
                          <View style={styles.appText}>
                            <Text style={[styles.appName, { color: textPrimary }]} numberOfLines={1}>
                              {item.appName}
                            </Text>
                            <Text style={[styles.appMeta, { color: textMuted }]} numberOfLines={1}>
                              {hasTarget
                                ? 'Target set'
                                : `${formatUsageDuration(item.totalTimeMs)} in the last 30 days`}
                            </Text>
                          </View>
                          <MaterialIcons name="chevron-right" size={20} color={textMuted} />
                        </Pressable>
                      );
                    }}
                  />
                )}
              </>
            )}
          </View>
        ) : selected ? (
          <ScrollView
            contentContainerStyle={[
              styles.form,
              { paddingBottom: insets.bottom + Spacing.jumbo },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.selectedApp}>
              <AppGlyph name={selected.appName} iconUri={selected.iconUri} size={48} />
              <Text style={[styles.selectedName, { color: textPrimary }]}>{selected.appName}</Text>
            </View>
            <Text style={[styles.body, { color: textSecondary }]}>
              Stay under the time you set. A day runs midnight to midnight. A week runs Monday
              through Sunday.
            </Text>

            <LimitEditor
              title="Daily cap"
              enabled={dailyOn}
              onToggle={setDailyOn}
              valueMs={dailyMs}
              maxMs={MAX_DAILY_TARGET_MS}
              onChange={setDailyMs}
              presets={DAILY_PRESETS_MINUTES.map((minutes) => ({
                label: formatUsageDuration(minutes * MINUTE_MS),
                ms: minutes * MINUTE_MS,
              }))}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              surface={surface}
              border={border}
            />

            <LimitEditor
              title="Weekly cap"
              enabled={weeklyOn}
              onToggle={setWeeklyOn}
              valueMs={weeklyMs}
              maxMs={MAX_WEEKLY_TARGET_MS}
              onChange={setWeeklyMs}
              presets={WEEKLY_PRESETS_HOURS.map((hours) => ({
                label: `${hours}h`,
                ms: hours * 60 * MINUTE_MS,
              }))}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              surface={surface}
              border={border}
            />

            {weeklyUnderDaily ? (
              <Text style={[styles.hint, { color: textSecondary }]}>
                The weekly cap is lower than the daily cap, so the week will fill up first.
              </Text>
            ) : null}
            {!dailyOn && !weeklyOn ? (
              <Text style={[styles.hint, { color: textSecondary }]}>
                Turn on a daily cap, a weekly cap, or both.
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Button
                label="Save target"
                onPress={handleSave}
                disabled={!dailyOn && !weeklyOn}
                fullWidth
              />
              {canDelete ? (
                <Button label="Remove target" onPress={handleDelete} variant="danger" fullWidth />
              ) : null}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

function LimitEditor({
  title,
  enabled,
  onToggle,
  valueMs,
  maxMs,
  onChange,
  presets,
  textPrimary,
  textSecondary,
  surface,
  border,
}: {
  title: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  valueMs: number;
  maxMs: number;
  onChange: (next: number) => void;
  presets: readonly { label: string; ms: number }[];
  textPrimary: string;
  textSecondary: string;
  surface: string;
  border: string;
}) {
  return (
    <View style={[styles.limitCard, { backgroundColor: surface, borderColor: border }]}>
      <View style={styles.limitHeader}>
        <Text style={[styles.limitTitle, { color: textPrimary }]}>{title}</Text>
        <Switch
          value={enabled}
          onValueChange={(next) => {
            haptics.light();
            onToggle(next);
          }}
          trackColor={{ false: '#bdbdbd', true: COLORS.primary }}
          thumbColor="#FFFFFF"
          accessibilityLabel={`${title} ${enabled ? 'on' : 'off'}`}
        />
      </View>
      {enabled ? (
        <>
          <Text style={[styles.limitValue, { color: textPrimary }]}>{formatUsageDuration(valueMs)}</Text>
          <View style={styles.stepRow}>
            <StepButton
              label="-1h"
              onPress={() => onChange(shiftLimit(valueMs, -60, maxMs))}
              disabled={valueMs <= 15 * MINUTE_MS}
            />
            <StepButton
              label="-15m"
              onPress={() => onChange(shiftLimit(valueMs, -15, maxMs))}
              disabled={valueMs <= 15 * MINUTE_MS}
            />
            <StepButton
              label="+15m"
              onPress={() => onChange(shiftLimit(valueMs, 15, maxMs))}
              disabled={valueMs >= maxMs}
            />
            <StepButton
              label="+1h"
              onPress={() => onChange(shiftLimit(valueMs, 60, maxMs))}
              disabled={valueMs >= maxMs}
            />
          </View>
          <View style={styles.presetRow}>
            {presets.map((preset) => {
              const active = valueMs === preset.ms;
              return (
                <Pressable
                  key={preset.label}
                  onPress={() => {
                    haptics.light();
                    onChange(clampTargetMinutes(preset.ms, maxMs));
                  }}
                  style={[
                    styles.preset,
                    { borderColor: border },
                    active && styles.presetActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Set ${title} to ${preset.label}`}
                >
                  <Text style={[styles.presetText, { color: active ? COLORS.text.onPrimary : textSecondary }]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <Text style={[styles.limitOff, { color: textSecondary }]}>Off</Text>
      )}
    </View>
  );
}

function StepButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        haptics.light();
        onPress();
      }}
      style={[styles.stepButton, disabled && styles.stepButtonDisabled]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
    >
      <Text style={[styles.stepLabel, disabled && styles.stepLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: TouchTargets.md,
    height: TouchTargets.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 20,
  },
  pickerBody: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  search: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
  },
  centered: {
    paddingVertical: Spacing.jumbo,
    alignItems: 'center',
  },
  empty: {
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  permissionBlock: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  appText: {
    flex: 1,
  },
  appName: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
  },
  appMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  form: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  selectedApp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  selectedName: {
    flex: 1,
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  limitCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitTitle: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
  },
  limitValue: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 28,
    marginTop: Spacing.sm,
  },
  limitOff: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    marginTop: Spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  stepButton: {
    flex: 1,
    minHeight: TouchTargets.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  stepButtonDisabled: {
    borderColor: COLORS.border,
  },
  stepLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    color: COLORS.primary,
  },
  stepLabelDisabled: {
    color: COLORS.text.muted,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  preset: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  presetActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  hint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  actions: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
});
