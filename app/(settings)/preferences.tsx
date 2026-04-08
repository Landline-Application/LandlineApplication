import React, { useMemo, useState } from 'react';

import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { usePreferencesStore } from '@/hooks/use-preferences-store';
import { haptics } from '@/services/haptics';
import {
  RETENTION_OPTIONS,
  type RetentionDays,
  formatNextCleanupRelative,
  getLastCleanupTimestamp,
  getRetentionLabel,
  setRetentionPeriod,
} from '@/services/notification-retention';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PreferencesScreen() {
  const insets = useSafeAreaInsets();

  // Retention — read directly from store (reactive to changes)
  const retentionDays = usePreferencesStore(
    (state) => state.notificationRetentionDays,
  ) as RetentionDays;
  const [retentionModalVisible, setRetentionModalVisible] = useState(false);
  // Modal draft value — initialized when modal opens (store is hydrated by then)
  const [selectedRetentionOption, setSelectedRetentionOption] =
    useState<RetentionDays>(retentionDays);

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
          General settings
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Data</Text>

          {/* Notification Retention */}
          <TouchableOpacity
            onPress={() => {
              haptics.light();
              openRetentionModal();
            }}
            activeOpacity={0.7}
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
