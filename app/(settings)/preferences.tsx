import React, { useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAutoReplyStore } from '@/hooks/use-auto-reply-store';
import { haptics } from '@/services/haptics';
import {
  RETENTION_OPTIONS,
  type RetentionDays,
  formatNextCleanupRelative,
  getLastCleanupTimestamp,
  getRetentionLabel,
  getRetentionPeriod,
  setRetentionPeriod,
} from '@/services/notification-retention';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SWITCH_TRACK_OFF = '#d4c5a0';
const SWITCH_TRACK_ON = '#a89968';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();

  const {
    isEnabled: autoReplyOn,
    isLoading: autoReplyLoading,
    enable: enableAutoReply,
    disable: disableAutoReply,
  } = useAutoReplyStore();

  const [savingAutoReply, setSavingAutoReply] = useState(false);

  // Retention — lazy init, nextCleanupText is derived
  const [retentionDays, setRetentionDays] = useState<RetentionDays>(() => getRetentionPeriod());
  const [retentionModalVisible, setRetentionModalVisible] = useState(false);
  const [selectedRetentionOption, setSelectedRetentionOption] = useState<RetentionDays>(() =>
    getRetentionPeriod(),
  );
  const nextCleanupText = useMemo(
    () => formatNextCleanupRelative(retentionDays, getLastCleanupTimestamp()),
    [retentionDays],
  );

  async function handleAutoReplyToggle(value: boolean) {
    setSavingAutoReply(true);
    try {
      if (value) {
        await enableAutoReply();
      } else {
        await disableAutoReply();
      }
      haptics.success();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update auto-reply.';
      Alert.alert('Auto-reply', msg);
    } finally {
      setSavingAutoReply(false);
    }
  }

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
      setRetentionDays(selectedRetentionOption);
      closeRetentionModal();
      haptics.light();
    } catch (error) {
      console.error('Error saving retention period:', error);
      Alert.alert('Error', 'Failed to save retention settings');
    }
  }

  const android = Platform.OS === 'android';
  const autoReplySwitchDisabled = savingAutoReply || autoReplyLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Preferences
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>App Behaviour</Text>

          {/* Auto-reply */}
          {android ? (
            <Card variant="elevated" padding="md" style={styles.prefCard}>
              <View style={styles.prefRow}>
                <View style={styles.prefTextBlock}>
                  <Text style={styles.prefTitle}>Auto-reply</Text>
                  <Text style={styles.prefSubtitle}>
                    Automatically reply to incoming messages while Landline Mode is active.
                  </Text>
                </View>
                <View style={styles.toggleContainer}>
                  {autoReplyLoading || savingAutoReply ? (
                    <ActivityIndicator color={COLORS.primary} style={styles.toggleLoader} />
                  ) : (
                    <Switch
                      value={autoReplyOn}
                      onValueChange={(v) => void handleAutoReplyToggle(v)}
                      disabled={autoReplySwitchDisabled}
                      trackColor={{ false: SWITCH_TRACK_OFF, true: SWITCH_TRACK_ON }}
                      thumbColor={autoReplyOn ? COLORS.primary : '#f4f3f4'}
                      accessibilityLabel="Auto-reply"
                      accessibilityHint="When on, automatic replies are sent while Landline Mode is active"
                    />
                  )}
                </View>
              </View>
            </Card>
          ) : (
            <Text style={styles.platformHint}>
              Auto-reply is available on Android. Your saved preference syncs and applies when you
              use the app on an Android device.
            </Text>
          )}

          {/* Notification Retention */}
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              openRetentionModal();
            }}
            activeOpacity={0.7}
            style={{ marginTop: Spacing.md }}
          >
            <Card variant="elevated" padding="md" style={styles.prefCard}>
              <View style={styles.prefRow}>
                <View style={styles.prefTextBlock}>
                  <Text style={styles.prefTitle}>Notification Retention</Text>
                  <Text style={styles.prefSubtitle}>
                    Auto-delete logged notifications after a set period.{' '}
                    <Text style={styles.nextCleanup}>{nextCleanupText}</Text>
                  </Text>
                </View>
                <View style={styles.retentionValueContainer}>
                  <Text style={styles.retentionValue}>{getRetentionLabel(retentionDays)}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
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
            <Text style={styles.modalTitle}>Notification Retention</Text>
            <Text style={styles.modalBody}>
              Choose how long to keep logged notifications before they are automatically deleted.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {RETENTION_OPTIONS.map((option) => {
                const isSelected = selectedRetentionOption === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.retentionOption, isSelected && styles.retentionOptionSelected]}
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
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.retentionModalFooter}>
              <Text style={styles.retentionPreviewText}>
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    gap: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingBottom: Spacing.jumbo,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  sectionHeader: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  prefCard: {
    ...Shadows.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
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
  toggleContainer: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLoader: {
    width: 28,
    height: 28,
  },
  platformHint: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 21,
    marginBottom: Spacing.lg,
    fontFamily: 'Nunito_400Regular',
    marginLeft: Spacing.xs,
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
