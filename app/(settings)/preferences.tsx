import React, { useMemo, useState } from 'react';

import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  SettingsDescriptionCard,
  SettingsPageHeader,
} from '@/components/settings/settings-page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { usePreferencesStore } from '@/hooks/use-preferences-store';
import { haptics } from '@/services/haptics';
import { rescheduleLandlineReminderAfterIntervalChange } from '@/services/landline-mode-reminder';
import {
  RETENTION_OPTIONS,
  type RetentionDays,
  formatNextCleanupRelative,
  getLastCleanupTimestamp,
  getRetentionLabel,
  setRetentionPeriod,
} from '@/services/notification-retention';
import { LANDLINE_REMINDER_INTERVAL_OPTIONS } from '@/utils/landline-reminder-interval';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const D_BG = '#5f5f5f';
const D_BORDER = '#3a3a3a';
const D_FG = '#FFFFFF';
const D_SOFT = '#E0E0E0';
const D_ACCENT = '#B8C4A8';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  // Retention — read directly from store (reactive to changes)
  const retentionDays = usePreferencesStore(
    (state) => state.notificationRetentionDays,
  ) as RetentionDays;
  const landlineReminderIntervalHours = usePreferencesStore(
    (state) => state.landlineReminderIntervalHours,
  );
  const setLandlineReminderIntervalHours = usePreferencesStore(
    (state) => state.setLandlineReminderIntervalHours,
  );
  const [retentionModalVisible, setRetentionModalVisible] = useState(false);
  // Modal draft value — initialized when modal opens (store is hydrated by then)
  const [selectedRetentionOption, setSelectedRetentionOption] =
    useState<RetentionDays>(retentionDays);
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [selectedReminderHours, setSelectedReminderHours] = useState(landlineReminderIntervalHours);

  const nextCleanupText = useMemo(
    () => formatNextCleanupRelative(retentionDays, getLastCleanupTimestamp()),
    [retentionDays],
  );

  function openRetentionModal() {
    setSelectedRetentionOption(retentionDays);
    setRetentionModalVisible(true);
  }

  function closeRetentionModal() {
    setRetentionModalVisible(false);
  }

  function handleSaveRetention() {
    try {
      setRetentionPeriod(selectedRetentionOption);
      closeRetentionModal();
      haptics.light();
    } catch (error) {
      console.error('Error saving retention period:', error);
      Alert.alert('Error', 'Failed to save retention settings');
    }
  }

  function openReminderModal() {
    setSelectedReminderHours(landlineReminderIntervalHours);
    setReminderModalVisible(true);
  }

  function closeReminderModal() {
    setReminderModalVisible(false);
  }

  async function handleSaveReminderInterval() {
    try {
      setLandlineReminderIntervalHours(selectedReminderHours);
      await rescheduleLandlineReminderAfterIntervalChange(selectedReminderHours);
      closeReminderModal();
      haptics.light();
    } catch (error) {
      console.error('Error saving reminder interval:', error);
      Alert.alert('Error', 'Failed to save reminder settings');
    }
  }

  function reminderIntervalLabel(hours: number) {
    return hours === 1 ? 'Every hour' : `Every ${hours} hours`;
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <SettingsPageHeader title="General settings" paddingTop={insets.top} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <SettingsDescriptionCard
            icon="tune"
            title="General settings"
            body="Control how long Landline keeps your notification log, and how often you get reminded while Landline Mode is on."
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Data</Text>

          <TouchableOpacity
            onPress={() => {
              haptics.light();
              openRetentionModal();
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.card,
                isDark && {
                  backgroundColor: '#4a4a4a',
                  borderColor: D_BORDER,
                  shadowColor: 'transparent',
                  elevation: 0,
                },
              ]}
            >
              <View style={styles.prefRow}>
                <View style={styles.prefTextBlock}>
                  <Text style={[styles.prefTitle, isDark && { color: D_FG }]}>
                    Notification Retention
                  </Text>
                  <Text style={[styles.prefSubtitle, isDark && { color: D_SOFT }]}>
                    Auto-delete logged notifications after a set period.{' '}
                    <Text style={[styles.nextCleanup, isDark && { color: '#FFD54F' }]}>
                      {nextCleanupText}
                    </Text>
                  </Text>
                </View>
                <View style={styles.retentionValueContainer}>
                  <Text style={[styles.retentionValue, isDark && { color: D_ACCENT }]}>
                    {getRetentionLabel(retentionDays)}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={isDark ? D_SOFT : COLORS.text.muted}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {Platform.OS === 'android' && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Landline Mode</Text>

            <TouchableOpacity
              onPress={() => {
                haptics.light();
                openReminderModal();
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.card,
                  isDark && {
                    backgroundColor: '#4a4a4a',
                    borderColor: D_BORDER,
                    shadowColor: 'transparent',
                    elevation: 0,
                  },
                ]}
              >
                <View style={styles.prefRow}>
                  <View style={styles.prefTextBlock}>
                    <Text style={[styles.prefTitle, isDark && { color: D_FG }]}>
                      Session reminder
                    </Text>
                    <Text style={[styles.prefSubtitle, isDark && { color: D_SOFT }]}>
                      Local notification while Landline Mode is on: “Still in Landline Mode?” with
                      options to keep it on or turn it off.
                    </Text>
                  </View>
                  <View style={styles.retentionValueContainer}>
                    <Text style={[styles.retentionValue, isDark && { color: D_ACCENT }]}>
                      {reminderIntervalLabel(landlineReminderIntervalHours)}
                    </Text>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={isDark ? D_SOFT : COLORS.text.muted}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: Spacing.jumbo }} />
      </ScrollView>

      {/* Retention Modal */}
      <Modal
        visible={retentionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRetentionModal}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.retentionModalContent}>
            <Text style={[styles.modalTitle, isDark && { color: D_FG }]}>Notification Retention</Text>
            <Text style={[styles.modalBody, isDark && { color: D_SOFT }]}>
              Choose how long to keep logged notifications before they are automatically deleted.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {RETENTION_OPTIONS.map((option) => {
                const isSelected = selectedRetentionOption === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.retentionOption,
                      isSelected && styles.retentionOptionSelected,
                      isDark &&
                        !isSelected && {
                          backgroundColor: '#3d3d3d',
                          borderWidth: 0,
                        },
                    ]}
                    onPress={() => {
                      haptics.light();
                      setSelectedRetentionOption(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.retentionOptionRadio,
                        isSelected && styles.retentionOptionRadioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.retentionOptionRadioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.retentionOptionText,
                        isSelected && styles.retentionOptionTextSelected,
                        isDark && !isSelected && { color: D_FG },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.retentionModalFooter, isDark && { borderTopColor: D_BORDER }]}>
              <Text style={[styles.retentionPreviewText, isDark && { color: D_SOFT }]}>
                {'Next cleanup: '}
                {formatNextCleanupRelative(selectedRetentionOption, new Date())}
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  label="Cancel"
                  onPress={closeRetentionModal}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Save"
                  onPress={handleSaveRetention}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>

      {/* Landline session reminder interval (Android) */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReminderModal}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.retentionModalContent}>
            <Text style={[styles.modalTitle, isDark && { color: D_FG }]}>Session reminder</Text>
            <Text style={[styles.modalBody, isDark && { color: D_SOFT }]}>
              How long can Landline Mode stay on before we ask if you still want it? You can snooze
              from the notification.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {LANDLINE_REMINDER_INTERVAL_OPTIONS.map((hours) => {
                const isSelected = selectedReminderHours === hours;
                return (
                  <TouchableOpacity
                    key={hours}
                    style={[
                      styles.retentionOption,
                      isSelected && styles.retentionOptionSelected,
                      isDark &&
                        !isSelected && {
                          backgroundColor: '#3d3d3d',
                          borderWidth: 0,
                        },
                    ]}
                    onPress={() => {
                      haptics.light();
                      setSelectedReminderHours(hours);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.retentionOptionRadio,
                        isSelected && styles.retentionOptionRadioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.retentionOptionRadioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.retentionOptionText,
                        isSelected && styles.retentionOptionTextSelected,
                        isDark && !isSelected && { color: D_FG },
                      ]}
                    >
                      {reminderIntervalLabel(hours)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.retentionModalFooter}>
              <View style={styles.modalButtons}>
                <Button
                  label="Cancel"
                  onPress={closeReminderModal}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Save"
                  onPress={() => void handleSaveReminderInterval()}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
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
  card: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  prefTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  prefTitle: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  prefSubtitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: Spacing.xs,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
  },
  nextCleanup: {
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
  },
  retentionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  retentionValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  retentionModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Shadows.xl,
  },
  modalTitle: {
    fontSize: 22,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  retentionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  retentionOptionSelected: {
    backgroundColor: 'rgba(93, 112, 82, 0.12)',
  },
  retentionOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.text.muted,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionOptionRadioSelected: {
    borderColor: COLORS.primary,
  },
  retentionOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  retentionOptionText: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
  },
  retentionOptionTextSelected: {
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.primary,
  },
  retentionModalFooter: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface.border,
  },
  retentionPreviewText: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
