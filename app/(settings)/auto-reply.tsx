import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAutoReplyStore } from '@/hooks/use-auto-reply-store';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TEMPLATES: { label: string; message: string }[] = [
  {
    label: 'In a Meeting',
    message: "I'm currently in a meeting. I'll get back to you as soon as possible.",
  },
  {
    label: 'Driving',
    message: "I'm driving right now and can't respond. I'll reply when I arrive safely.",
  },
  {
    label: 'Focus Time',
    message:
      "I'm in focus mode and not checking messages right now. I'll get back to you later today.",
  },
  {
    label: 'On Vacation',
    message:
      "I'm currently out of office on vacation. I'll respond when I return. Thank you for your patience!",
  },
  {
    label: 'Away',
    message: "I'm away from my phone right now. I'll get back to you shortly.",
  },
];

const APP_PRESETS: { label: string; description: string; packages: string[] }[] = [
  {
    label: 'All Apps',
    description: 'Reply to any app that supports inline replies',
    packages: [],
  },
  {
    label: 'Messaging Only',
    description: 'WhatsApp, Messenger, Telegram, Google Messages',
    packages: [
      'com.whatsapp',
      'com.facebook.orca',
      'org.telegram.messenger',
      'com.google.android.apps.messaging',
    ],
  },
  {
    label: 'WhatsApp Only',
    description: 'Only WhatsApp messages',
    packages: ['com.whatsapp'],
  },
];

export default function AutoReplyScreen() {
  const insets = useSafeAreaInsets();

  const {
    isEnabled,
    hasPermission,
    isServiceRunning,
    message,
    allowedApps,
    isLoading,
    enable,
    disable,
    setMessage,
    setAllowedApps,
    requestPermission,
  } = useAutoReplyStore();

  const autoReplyDisabled = true;
  const [customMessage, setCustomMessage] = useState('');
  const [isSavingMessage, setIsSavingMessage] = useState(false);

  async function handleToggle(value: boolean) {
    if (autoReplyDisabled) {
      Alert.alert(
        'Auto-Reply temporarily disabled',
        'Auto-reply is turned off while we finalize the user flow and logic.',
      );
      return;
    }
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Landline needs notification listener access to send auto-replies.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Grant Access', onPress: handleRequestPermission },
        ],
      );
      return;
    }
    haptics.light();
    try {
      if (value) {
        await enable();
      } else {
        await disable();
      }
    } catch {
      Alert.alert('Error', 'Could not update auto-reply setting. Please try again.');
    }
  }

  async function handleRequestPermission() {
    try {
      await requestPermission();
      Alert.alert(
        'Open Settings',
        'Please enable Notification Access for Landline in the list that opens.',
      );
    } catch {
      Alert.alert('Error', 'Could not open permission settings.');
    }
  }

  async function handleApplyTemplate(templateMessage: string, label: string) {
    haptics.light();
    try {
      await setMessage(templateMessage);
    } catch {
      Alert.alert('Error', `Could not apply "${label}" template.`);
    }
  }

  async function handleSaveCustomMessage() {
    const trimmed = customMessage.trim();
    if (!trimmed) {
      Alert.alert('Empty Message', 'Please enter a reply message before saving.');
      return;
    }
    setIsSavingMessage(true);
    haptics.light();
    try {
      await setMessage(trimmed);
      setCustomMessage('');
    } catch {
      Alert.alert('Error', 'Could not save the message. Please try again.');
    } finally {
      setIsSavingMessage(false);
    }
  }

  async function handleApplyPreset(packages: string[], label: string) {
    haptics.light();
    try {
      await setAllowedApps(packages);
    } catch {
      Alert.alert('Error', `Could not apply "${label}" filter.`);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Auto-Reply</Text>
          <Text style={styles.headerSubtitle}>Respond automatically while focused</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Status / Enable section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Auto-Reply</Text>

          {autoReplyDisabled && (
            <View style={styles.disabledBanner}>
              <MaterialIcons name="info-outline" size={18} color={COLORS.secondary} />
              <Text style={styles.disabledBannerText}>
                Auto-reply is temporarily disabled while we finalize the user flow and logic.
              </Text>
            </View>
          )}

          {/* Permission warning */}
          {!hasPermission && (
            <TouchableOpacity
              style={styles.warningCard}
              onPress={handleRequestPermission}
              activeOpacity={0.8}
            >
              <MaterialIcons name="warning" size={20} color={COLORS.warning} />
              <View style={styles.warningCardText}>
                <Text style={styles.warningTitle}>Notification access required</Text>
                <Text style={styles.warningBody}>
                  Tap to open Settings and enable Notification Access for Landline.
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={COLORS.warning} />
            </TouchableOpacity>
          )}

          {/* Enable toggle row */}
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleRowContent}>
                <Text style={styles.toggleLabel}>Enable Auto-Reply</Text>
                <Text style={styles.toggleSubtitle}>
                  {isEnabled
                    ? 'Will auto-reply when Landline Mode is on'
                    : 'Disabled — no replies will be sent'}
                </Text>
              </View>
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary}
                  style={styles.toggleLoader}
                />
              ) : (
                <Switch
                  value={isEnabled}
                  onValueChange={handleToggle}
                  disabled={autoReplyDisabled || (!hasPermission && !isEnabled)}
                  trackColor={{ false: COLORS.accent, true: `${COLORS.primary}80` }}
                  thumbColor={isEnabled ? COLORS.primary : COLORS.text.muted}
                />
              )}
            </View>

            {/* Status indicators */}
            <View style={styles.statusRow}>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: hasPermission ? COLORS.success : COLORS.error },
                  ]}
                />
                <Text style={styles.statusText}>
                  {hasPermission ? 'Permission granted' : 'No permission'}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isServiceRunning ? COLORS.success : COLORS.text.muted },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isServiceRunning ? 'Service running' : 'Service stopped'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Reply message ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reply Message</Text>

          {/* Current message preview */}
          {!!message && (
            <View style={styles.messagePreviewCard}>
              <MaterialIcons name="chat-bubble-outline" size={16} color={COLORS.primary} />
              <Text style={styles.messagePreviewText} numberOfLines={3}>
                {message}
              </Text>
            </View>
          )}

          {/* Templates */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Quick Templates</Text>
            {TEMPLATES.map((t) => {
              const isActive = message === t.message;
              return (
                <TouchableOpacity
                  key={t.label}
                  style={[styles.templateRow, isActive && styles.templateRowActive]}
                  onPress={() => handleApplyTemplate(t.message, t.label)}
                  activeOpacity={0.7}
                >
                  <View style={styles.templateRowContent}>
                    <Text style={[styles.templateLabel, isActive && styles.templateLabelActive]}>
                      {t.label}
                    </Text>
                    <Text style={styles.templatePreview} numberOfLines={1}>
                      {t.message}
                    </Text>
                  </View>
                  {isActive && (
                    <MaterialIcons name="check-circle" size={18} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom message */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Custom Message</Text>
            <TextInput
              style={styles.textInput}
              value={customMessage}
              onChangeText={setCustomMessage}
              placeholder="Type your auto-reply message…"
              placeholderTextColor={COLORS.text.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCorrect
              autoCapitalize="sentences"
            />
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!customMessage.trim() || isSavingMessage) && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveCustomMessage}
              disabled={!customMessage.trim() || isSavingMessage}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>
                {isSavingMessage ? 'Saving…' : 'Set as Reply Message'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── App filter ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Reply to Apps</Text>
          {APP_PRESETS.map((preset) => {
            const isActive =
              preset.packages.length === allowedApps.length &&
              preset.packages.every((p) => allowedApps.includes(p));
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.presetRow, isActive && styles.presetRowActive]}
                onPress={() => handleApplyPreset(preset.packages, preset.label)}
                activeOpacity={0.7}
              >
                <View style={[styles.presetRadio, isActive && styles.presetRadioActive]}>
                  {isActive && <View style={styles.presetRadioInner} />}
                </View>
                <View style={styles.presetContent}>
                  <Text style={[styles.presetLabel, isActive && styles.presetLabelActive]}>
                    {preset.label}
                  </Text>
                  <Text style={styles.presetDescription}>{preset.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Info footer ── */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={16} color={COLORS.text.muted} />
          <Text style={styles.infoText}>
            Auto-Reply only works while Landline Mode is active. It sends your message to incoming
            notifications that support inline replies (e.g. WhatsApp, Messenger).
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

  // Header
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
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 1,
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  // Section
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

  // Card container
  card: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardSectionTitle: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  cardSectionTitleHighlight: {
    color: COLORS.primary,
    textTransform: 'none',
    letterSpacing: 0,
    fontFamily: 'Nunito_700Bold',
  },

  // Permission warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: `${COLORS.warning}10`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },

  disabledBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: `${COLORS.secondary}10`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}25`,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  disabledBannerText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 16,
  },
  warningCardText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    color: COLORS.warning,
    fontFamily: 'Nunito_700Bold',
  },
  warningBody: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  toggleRowContent: {
    flex: 1,
  },
  toggleLoader: {
    width: 51,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLabel: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  toggleSubtitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
    lineHeight: 18,
  },

  // Status indicators
  statusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface.elevated,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
  },

  // Message preview
  messagePreviewCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  messagePreviewText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text.primary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Templates
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: Spacing.xs,
  },
  templateRowActive: {
    backgroundColor: `${COLORS.primary}08`,
    borderColor: `${COLORS.primary}25`,
  },
  templateRowContent: {
    flex: 1,
  },
  templateLabel: {
    fontSize: 15,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  templateLabelActive: {
    color: COLORS.primary,
  },
  templatePreview: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },

  // Custom message input
  textInput: {
    backgroundColor: COLORS.surface.elevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 14,
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
    minHeight: 90,
    marginBottom: Spacing.md,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 15,
    color: COLORS.text.onPrimary,
    fontFamily: 'Nunito_700Bold',
  },

  // App filter presets
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: Spacing.sm,
  },
  presetRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}08`,
  },
  presetRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  presetRadioActive: {
    borderColor: COLORS.primary,
  },
  presetRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  presetContent: {
    flex: 1,
  },
  presetLabel: {
    fontSize: 15,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  presetLabelActive: {
    color: COLORS.primary,
  },
  presetDescription: {
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },

  // Info box
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
});
