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

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
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

export default function FeedbackScreen() {
  const insets = useSafeAreaInsets();
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
      Alert.alert('Thank you!', 'Your feedback has been submitted. We appreciate you taking the time to help us improve.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Feedback submission error:', error);
      Alert.alert('Could not send', 'Something went wrong. Please try again or email us directly.');
    } finally {
      setIsSubmitting(false);
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
          <Text style={styles.headerTitle}>Send Feedback</Text>
          <Text style={styles.headerSubtitle}>Help us improve Landline</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{"What's this about?"}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(({ key, label, icon }) => {
              const isSelected = category === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                  onPress={() => {
                    haptics.light();
                    setCategory(key);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={icon}
                    size={18}
                    color={isSelected ? COLORS.primary : COLORS.text.muted}
                  />
                  <Text
                    style={[styles.categoryChipText, isSelected && styles.categoryChipTextSelected]}
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
          <Text style={styles.sectionLabel}>Your message</Text>
          <Card variant="elevated" padding="none" style={styles.card}>
            <TextInput
              ref={messageRef}
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder={
                category === 'bug'
                  ? 'Describe what happened and what you expected...'
                  : category === 'feature'
                    ? "Describe the feature you'd like to see..."
                    : "Tell us what's on your mind..."
              }
              placeholderTextColor={COLORS.text.muted}
              multiline
              textAlignVertical="top"
              maxLength={MAX_MESSAGE_LENGTH}
              autoFocus={false}
            />
            <View style={styles.charCount}>
              <Text style={styles.charCountText}>
                {trimmedMessage.length} / {MAX_MESSAGE_LENGTH}
              </Text>
            </View>
          </Card>
        </View>

        {/* Context Info */}
        <View style={styles.infoBox}>
          <MaterialIcons name="info-outline" size={16} color={COLORS.text.muted} />
          <Text style={styles.infoText}>
            {user
              ? 'Your account info will be attached so we can follow up if needed.'
              : "Feedback is anonymous. Create an account if you'd like us to follow up."}
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
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.jumbo,
  },
  section: {
    marginBottom: Spacing.xl,
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
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 18,
  },
});
