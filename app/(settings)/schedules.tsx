import React, { useCallback, useState } from 'react';

import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import {
  SettingsDescriptionCard,
  SettingsPageHeader,
} from '@/components/settings/settings-page-header';
import { Button } from '@/components/ui/button';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { Switch } from '@/components/ui/switch';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import {
  areLandlineSchedulesSupported,
  canScheduleExactAlarms,
  getLandlineSchedules,
  requestExactAlarmPermission,
  setLandlineSchedules,
} from '@/modules/notification-api-manager';
import { haptics } from '@/services/haptics';
import {
  SCHEDULE_DAY_LABELS,
  SCHEDULE_DAY_NAMES,
  SCHEDULE_TEMPLATES,
  createScheduleId,
  formatScheduleDays,
  formatScheduleMinutes,
  formatScheduleRange,
  scheduleCrossesMidnight,
  validateLandlineSchedule,
  type LandlineSchedule,
} from '@/utils/landline-schedule';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const D_BG = '#5f5f5f';
const D_SURFACE = '#4a4a4a';
const D_BORDER = '#3a3a3a';
const D_FG = '#FFFFFF';
const D_SOFT = '#E0E0E0';
const D_MUTED = '#A8A8A8';
const D_ACCENT = '#B8C4A8';

type EditorState = {
  isNew: boolean;
  schedule: LandlineSchedule;
};

function shiftMinutes(minutes: number, delta: number): number {
  return (minutes + delta + 1440) % 1440;
}

function blankSchedule(): LandlineSchedule {
  return {
    id: createScheduleId(),
    enabled: true,
    startMinutes: 9 * 60,
    endMinutes: 17 * 60,
    days: [1, 2, 3, 4, 5],
    name: '',
  };
}

export default function SchedulesScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [schedules, setSchedules] = useState<LandlineSchedule[]>([]);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [supported, setSupported] = useState(true);
  const [exactAlarmsAllowed, setExactAlarmsAllowed] = useState(true);

  const load = useCallback(() => {
    if (Platform.OS !== 'android') return;
    setSupported(areLandlineSchedulesSupported());
    setSchedules(getLandlineSchedules());
    setExactAlarmsAllowed(canScheduleExactAlarms());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const persist = useCallback(
    (next: LandlineSchedule[]) => {
      const saved = setLandlineSchedules(next);
      if (!saved) {
        Alert.alert('Schedule', 'Could not save this schedule. Please try again.');
        load();
        return false;
      }
      setSchedules(getLandlineSchedules());
      return true;
    },
    [load],
  );

  const onToggleEnabled = (schedule: LandlineSchedule, enabled: boolean) => {
    haptics.light();
    persist(schedules.map((item) => (item.id === schedule.id ? { ...item, enabled } : item)));
  };

  const onDelete = (schedule: LandlineSchedule) => {
    const label = schedule.name.trim() || formatScheduleRange(schedule);
    Alert.alert('Delete schedule?', `${label} will stop turning Landline Mode on and off.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          haptics.warning();
          if (persist(schedules.filter((item) => item.id !== schedule.id))) {
            setEditor((current) => (current?.schedule.id === schedule.id ? null : current));
          }
        },
      },
    ]);
  };

  const onSaveEditor = () => {
    if (!editor) return;
    const schedule: LandlineSchedule = {
      ...editor.schedule,
      name: editor.schedule.name.trim(),
      days: [...new Set(editor.schedule.days)].sort((a, b) => a - b),
    };
    const error = validateLandlineSchedule(schedule, schedules.length, editor.isNew);
    if (error) {
      Alert.alert('Schedule', error);
      return;
    }
    const next = editor.isNew
      ? [...schedules, schedule]
      : schedules.map((item) => (item.id === schedule.id ? schedule : item));
    if (persist(next)) {
      haptics.success();
      setEditor(null);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
        <SettingsPageHeader title="Schedule" paddingTop={insets.top} />
        <View style={styles.centerContainer}>
          <MaterialIcons name="schedule" size={48} color={isDark ? D_MUTED : COLORS.text.muted} />
          <Text style={[styles.unsupportedTitle, isDark && { color: D_FG }]}>Android only</Text>
          <Text style={[styles.unsupportedText, isDark && { color: D_SOFT }]}>
            Automatic Landline Mode schedules use Android alarms. They are not available on this
            platform.
          </Text>
          <TouchableOpacity style={styles.unsupportedButton} onPress={() => router.back()}>
            <Text style={styles.unsupportedButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const title = editor ? (editor.isNew ? 'New schedule' : 'Edit schedule') : 'Schedule';

  return (
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <SettingsPageHeader
        title={title}
        paddingTop={insets.top}
        onBack={
          editor
            ? () => {
                haptics.light();
                setEditor(null);
              }
            : undefined
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
        {editor ? (
          <ScheduleEditor
            isDark={isDark}
            draft={editor.schedule}
            onChange={(schedule) => setEditor({ ...editor, schedule })}
            onSave={onSaveEditor}
            onDelete={editor.isNew ? undefined : () => onDelete(editor.schedule)}
          />
        ) : (
          <ScheduleList
            isDark={isDark}
            schedules={schedules}
            supported={supported}
            exactAlarmsAllowed={exactAlarmsAllowed}
            onRequestExactAlarms={() => {
              requestExactAlarmPermission();
            }}
            onAdd={() => {
              haptics.light();
              setEditor({ isNew: true, schedule: blankSchedule() });
            }}
            onEdit={(schedule) => {
              haptics.light();
              setEditor({ isNew: false, schedule });
            }}
            onToggleEnabled={onToggleEnabled}
            onDelete={onDelete}
          />
        )}
      </ScrollView>
    </View>
  );
}

function ScheduleList({
  isDark,
  schedules,
  supported,
  exactAlarmsAllowed,
  onRequestExactAlarms,
  onAdd,
  onEdit,
  onToggleEnabled,
  onDelete,
}: {
  isDark: boolean;
  schedules: LandlineSchedule[];
  supported: boolean;
  exactAlarmsAllowed: boolean;
  onRequestExactAlarms: () => void;
  onAdd: () => void;
  onEdit: (schedule: LandlineSchedule) => void;
  onToggleEnabled: (schedule: LandlineSchedule, enabled: boolean) => void;
  onDelete: (schedule: LandlineSchedule) => void;
}) {
  return (
    <>
      <View style={styles.section}>
        <SettingsDescriptionCard
          icon="schedule"
          title="Automatic Landline Mode"
          body="Create one or more recurring schedules. Landline Mode turns on at the start time and off at the end time, including after the app is closed or the phone restarts. Turning the dial by hand still works and overrides the current window without deleting the schedule."
        />
      </View>

      {!supported && (
        <View style={styles.section}>
          <Text style={[styles.warningText, isDark && { color: D_SOFT }]}>
            This install does not include schedule support yet. Rebuild the Android app to use it.
          </Text>
        </View>
      )}

      {supported && !exactAlarmsAllowed && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.warningCard, isDark && { backgroundColor: D_SURFACE, borderColor: D_BORDER }]}
            onPress={onRequestExactAlarms}
            activeOpacity={0.7}
          >
            <MaterialIcons name="alarm" size={22} color={isDark ? D_ACCENT : COLORS.secondary} />
            <View style={styles.warningCopy}>
              <Text style={[styles.cardTitle, isDark && { color: D_FG }]}>Allow exact alarms</Text>
              <Text style={[styles.cardSubtitle, isDark && { color: D_SOFT }]}>
                Android can delay schedule changes until exact alarms are allowed for Landline.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Your schedules</Text>
        {schedules.length === 0 ? (
          <Text style={[styles.emptyText, isDark && { color: D_SOFT }]}>
            No schedules yet. Add weeknights, work hours, or any other recurring window.
          </Text>
        ) : (
          schedules.map((schedule) => {
            const named = schedule.name.trim();
            const title = named || formatScheduleRange(schedule);
            const detail = named
              ? `${formatScheduleRange(schedule)} · ${formatScheduleDays(schedule.days)}`
              : formatScheduleDays(schedule.days);
            return (
              <View
                key={schedule.id}
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
                <TouchableOpacity
                  style={styles.cardMain}
                  onPress={() => onEdit(schedule)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${title}. ${detail}. ${schedule.enabled ? 'Enabled' : 'Paused'}`}
                >
                  <Text style={[styles.cardTitle, isDark && { color: D_FG }]}>{title}</Text>
                  <Text style={[styles.cardSubtitle, isDark && { color: D_SOFT }]}>{detail}</Text>
                  {!schedule.enabled && (
                    <Text style={[styles.pausedLabel, isDark && { color: D_MUTED }]}>Paused</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.cardActions}>
                  <Switch
                    checked={schedule.enabled}
                    onChange={(enabled) => onToggleEnabled(schedule, enabled)}
                  />
                  <TouchableOpacity
                    onPress={() => onDelete(schedule)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${title}`}
                    hitSlop={8}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={22}
                      color={isDark ? D_MUTED : COLORS.text.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
        <Button label="Add schedule" onPress={onAdd} variant="primary" fullWidth />
      </View>
    </>
  );
}

function ScheduleEditor({
  isDark,
  draft,
  onChange,
  onSave,
  onDelete,
}: {
  isDark: boolean;
  draft: LandlineSchedule;
  onChange: (schedule: LandlineSchedule) => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const applyTemplate = (template: (typeof SCHEDULE_TEMPLATES)[number]) => {
    haptics.light();
    onChange({
      ...draft,
      name: template.name,
      startMinutes: template.startMinutes,
      endMinutes: template.endMinutes,
      days: [...template.days],
    });
  };

  const toggleDay = (day: number) => {
    haptics.light();
    const days = draft.days.includes(day)
      ? draft.days.filter((value) => value !== day)
      : [...draft.days, day];
    onChange({ ...draft, days });
  };

  return (
    <>
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Start from</Text>
        <View style={styles.templateRow}>
          {SCHEDULE_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.name}
              style={[
                styles.templateChip,
                isDark && { backgroundColor: D_SURFACE, borderColor: D_BORDER },
              ]}
              onPress={() => applyTemplate(template)}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name={template.name === 'Weeknights' ? 'nightlight' : 'work-outline'}
                size={16}
                color={isDark ? D_ACCENT : COLORS.primary}
              />
              <Text style={[styles.templateChipText, isDark && { color: D_FG }]}>{template.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Name</Text>
        <TextInput
          value={draft.name}
          onChangeText={(name) => onChange({ ...draft, name })}
          placeholder="Optional, like Weeknights"
          placeholderTextColor={isDark ? D_MUTED : COLORS.text.muted}
          maxLength={40}
          style={[
            styles.nameInput,
            isDark && { backgroundColor: D_SURFACE, borderColor: D_BORDER, color: D_FG },
          ]}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Time</Text>
        <TimeStepper
          isDark={isDark}
          label="Starts"
          minutes={draft.startMinutes}
          onChange={(startMinutes) => onChange({ ...draft, startMinutes })}
        />
        <TimeStepper
          isDark={isDark}
          label="Ends"
          minutes={draft.endMinutes}
          onChange={(endMinutes) => onChange({ ...draft, endMinutes })}
        />
        {scheduleCrossesMidnight(draft) && (
          <Text style={[styles.hint, isDark && { color: D_SOFT }]}>
            This continues into the next morning. Selected days are the evenings it starts.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Days</Text>
        <View style={styles.dayRow}>
          {SCHEDULE_DAY_LABELS.map((label, day) => {
            const selected = draft.days.includes(day);
            return (
              <TouchableOpacity
                key={SCHEDULE_DAY_NAMES[day]}
                style={[
                  styles.dayChip,
                  selected && styles.dayChipSelected,
                  isDark && !selected && { backgroundColor: D_SURFACE, borderColor: D_BORDER },
                ]}
                onPress={() => toggleDay(day)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={SCHEDULE_DAY_NAMES[day]}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    selected && styles.dayChipTextSelected,
                    isDark && !selected && { color: D_SOFT },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Button label="Save schedule" onPress={onSave} variant="primary" fullWidth />
        {onDelete && (
          <Button label="Delete schedule" onPress={onDelete} variant="danger" fullWidth />
        )}
      </View>
    </>
  );
}

function TimeStepper({
  isDark,
  label,
  minutes,
  onChange,
}: {
  isDark: boolean;
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
}) {
  return (
    <View
      style={[
        styles.timeCard,
        isDark && { backgroundColor: D_SURFACE, borderColor: D_BORDER },
      ]}
    >
      <View style={styles.timeHeader}>
        <Text style={[styles.cardSubtitle, isDark && { color: D_SOFT }]}>{label}</Text>
        <Text style={[styles.timeValue, isDark && { color: D_FG }]}>
          {formatScheduleMinutes(minutes)}
        </Text>
      </View>
      <View style={styles.stepRow}>
        <StepButton isDark={isDark} label="-1 hr" onPress={() => onChange(shiftMinutes(minutes, -60))} />
        <StepButton isDark={isDark} label="-5 min" onPress={() => onChange(shiftMinutes(minutes, -5))} />
        <StepButton isDark={isDark} label="+5 min" onPress={() => onChange(shiftMinutes(minutes, 5))} />
        <StepButton isDark={isDark} label="+1 hr" onPress={() => onChange(shiftMinutes(minutes, 60))} />
      </View>
    </View>
  );
}

function StepButton({
  isDark,
  label,
  onPress,
}: {
  isDark: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.stepButton, isDark && { backgroundColor: D_BG, borderColor: D_BORDER }]}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.stepButtonText, isDark && { color: D_FG }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: COLORS.primary,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardMain: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  cardActions: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pausedLabel: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.muted,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text.secondary,
    marginBottom: Spacing.sm,
  },
  warningCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface.elevated,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.md,
  },
  warningCopy: {
    flex: 1,
    gap: 4,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.secondary,
  },
  templateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.elevated,
  },
  templateChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: Radius.md,
    backgroundColor: COLORS.surface.card,
    color: COLORS.foreground,
    fontSize: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  timeCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: Radius.lg,
    backgroundColor: COLORS.surface.card,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stepButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.elevated,
  },
  stepButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface.elevated,
  },
  dayChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
  },
  dayChipTextSelected: {
    color: COLORS.primaryForeground,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  unsupportedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.foreground,
  },
  unsupportedText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: COLORS.text.secondary,
  },
  unsupportedButton: {
    marginTop: Spacing.sm,
    backgroundColor: COLORS.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  unsupportedButtonText: {
    color: COLORS.primaryForeground,
    fontWeight: '700',
  },
});
