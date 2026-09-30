import React, { useRef, useState } from 'react';

import {
  Alert,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Constants from 'expo-constants';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import {
  SettingsDescriptionCard,
  SettingsPageHeader,
} from '@/components/settings/settings-page-header';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { haptics } from '@/services/haptics';
import { submitFeedback } from '@/utils/firebase/feedback-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES = [
  { key: 'bug', label: 'Bug Report', icon: 'bug-report' as const },
  { key: 'feature', label: 'Feature Request', icon: 'lightbulb' as const },
  { key: 'general', label: 'General Feedback', icon: 'chat' as const },
] as const;

type Category = (typeof CATEGORIES)[number]['key'];

const MAX_MESSAGE_LENGTH = 2000;

const D_BG = '#5f5f5f';
const D_BORDER = '#3a3a3a';
const D_SURFACE = '#4a4a4a';
const D_ACCENT = '#B8C4A8';
const D_MUTED = '#A8A8A8';
const D_FG = '#FFFFFF';

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { user } = useAuth();
  const messageRef = useRef<TextInput>(null);

  const [category, setCategory] = useState<Category>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedMessage = message.trim();
  const canSubmit = trimmedMessage.length > 0 && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    Keyboard.dismiss();
    setIsSubmitting(true);
    haptics.light();

    try {
      await submitFeedback({
        category,
        message: trimmedMessage,
        uid: user?.uid ?? null,
        displayName: user?.displayName ?? null,
        email: user?.email ?? null,
        appVersion: Constants.expoConfig?.version ?? 'unknown',
        platform: Platform.OS,
        osVersion: String(Platform.Version),
      });

      haptics.success();
      Alert.alert(
        'Thank you!',
        'Your feedback has been submitted. We appreciate you taking the time to help us improve.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error) {
      console.error('Feedback submission error:', error);
      Alert.alert('Could not send', 'Something went wrong. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <SettingsPageHeader title="Send Feedback" paddingTop={insets.top} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <SettingsDescriptionCard
            icon="feedback"
            title="Send Feedback"
            body="Report a bug, request a feature, or share thoughts. Your account info is attached so we can follow up if needed."
          />
        </View>

        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>
            {"What's this about?"}
          </Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(({ key, label, icon }) => {
              const isSelected = category === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryChip,
                    isSelected && styles.categoryChipSelected,
                    isDark &&
                      !isSelected && {
                        backgroundColor: '#4f4f4f',
                        borderColor: D_BORDER,
                      },
                  ]}
                  onPress={() => {
                    haptics.light();
                    setCategory(key);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={icon}
                    size={18}
                    color={isSelected ? COLORS.primary : isDark ? D_MUTED : COLORS.text.muted}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      isSelected && styles.categoryChipTextSelected,
                      isDark && !isSelected && { color: D_MUTED },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Message Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Your message</Text>
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
            <TextInput
              ref={messageRef}
              style={[
                styles.messageInput,
                isDark && {
                  color: D_FG,
                  backgroundColor: '#3d3d3d',
                },
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder={
                category === 'bug'
                  ? 'Describe what happened and what you expected...'
                  : category === 'feature'
                    ? "Describe the feature you'd like to see..."
                    : "Tell us what's on your mind..."
              }
              placeholderTextColor={isDark ? '#999' : COLORS.text.muted}
              multiline
              textAlignVertical="top"
              maxLength={MAX_MESSAGE_LENGTH}
              autoFocus={false}
            />
            <View style={styles.charCount}>
              <Text style={[styles.charCountText, isDark && { color: D_MUTED }]}>
                {trimmedMessage.length} / {MAX_MESSAGE_LENGTH}
              </Text>
            </View>
          </View>
        </View>

        {/* Context Info */}
        <View
          style={[
            styles.infoBox,
            isDark && { backgroundColor: D_SURFACE, borderWidth: 1, borderColor: D_BORDER },
          ]}
        >
          <MaterialIcons name="info-outline" size={16} color={isDark ? D_MUTED : COLORS.text.muted} />
          <Text style={[styles.infoText, isDark && { color: D_MUTED }]}>
            Your account info will be attached so we can follow up if needed.
          </Text>
        </View>

        {/* Submit */}
        <Button
          label={isSubmitting ? 'Sending...' : 'Send Feedback'}
          onPress={handleSubmit}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!canSubmit}
          loading={isSubmitting}
        />

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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface.elevated,
  },
  categoryChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_600SemiBold',
  },
  categoryChipTextSelected: {
    color: COLORS.primary,
  },
  card: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  messageInput: {
    minHeight: 160,
    padding: Spacing.lg,
    fontSize: 15,
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
  },
  charCount: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  charCountText: {
    fontSize: 12,
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
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 17,
  },
});
