import React, { useCallback, useState } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { Blob, Button, Card, Page } from '@/components/onboarding/onboarding-primitives';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { COLORS, Fonts, Shadows, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STEP_LABELS = ['Welcome', 'Account', 'Verify', 'Access'];

type StepIcon = keyof typeof MaterialIcons.glyphMap;

interface WalkthroughStep {
  title: string;
  body: string;
  /** Short checklist lines shown under the body */
  bullets: string[];
  icon: StepIcon;
  accentColor: string;
}

const STEPS: WalkthroughStep[] = [
  {
    title: 'Set up Landline',
    body: "Here's what we'll walk through before you start. You can move at your own pace—each step takes only a moment.",
    bullets: [
      'Create or sign in to an account',
      'Confirm your contact information',
      'Allow the access Landline needs to run',
    ],
    icon: 'waving-hand',
    accentColor: COLORS.primary,
  },
  {
    title: 'Create your account',
    body: 'Add an email and password, or use Google. An account keeps your preferences backed up and makes it easier to recover access.',
    bullets: [
      'Use a real email—you’ll verify it next',
      'Choose a strong password (or sign in with Google)',
      'You can skip for now and add one later in Settings',
    ],
    icon: 'person-add-alt',
    accentColor: COLORS.secondary,
  },
  {
    title: 'Verify your contact',
    body: 'After sign-up, check your email for a verification link from us. If you ever sign in with your phone number, we’ll text a short code—enter the 6 digits to confirm it’s you.',
    bullets: [
      'Email: tap the link in the message we send',
      'Phone/SMS: enter the code on the verification screen',
      'Didn’t get it? Check spam or request a new code',
    ],
    icon: 'mark-email-read',
    accentColor: COLORS.primary,
  },
  {
    title: 'Allow permissions',
    body: 'Landline needs a few system permissions to capture notifications, respect your focus settings, and show you what’s happening at a glance.',
    bullets: [
      'We’ll ask on the next screens—tap Allow when prompted',
      'You can change these later in your device Settings',
      'We only use access needed for Landline features',
    ],
    icon: 'admin-panel-settings',
    accentColor: '#8B7355',
  },
];

export default function SetupWalkthroughScreen() {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);

  const step = STEPS[index];
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      router.replace('/create-account');
      return;
    }
    setIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, [isLast]);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  return (
    <Page
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + Spacing.lg,
      }}
    >
      <Blob
        color={step.accentColor}
        size={300}
        top={-50}
        right={-90}
        opacity={0.09}
        shapeIndex={index}
      />
      <Blob
        color={COLORS.accent}
        size={200}
        bottom={100}
        left={-70}
        opacity={0.11}
        shapeIndex={(index + 2) % 4}
      />

      <View style={styles.container}>
        <OnboardingProgress total={STEPS.length} current={index} labels={STEP_LABELS} />

        <View style={styles.cardWrap}>
          <Card style={styles.card}>
            <View style={[styles.iconRing, { borderColor: `${step.accentColor}40` }]}>
              <View style={[styles.iconInner, { backgroundColor: `${step.accentColor}18` }]}>
                <MaterialIcons name={step.icon} size={40} color={step.accentColor} />
              </View>
            </View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.body}>{step.body}</Text>

            <View style={styles.bulletBlock}>
              {step.bullets.map((line, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: step.accentColor }]} />
                  <Text style={styles.bulletText}>{line}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        <View style={styles.actions}>
          <View style={styles.navRow}>
            {!isFirst ? (
              <Pressable
                onPress={goBack}
                style={({ pressed }) => [styles.backTap, pressed && styles.backTapPressed]}
                accessibilityRole="button"
                accessibilityLabel="Previous step"
              >
                <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
                <Text style={styles.backLabel}>Back</Text>
              </Pressable>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
          </View>

          <Button
            label={isLast ? 'Start setup' : 'Next'}
            onPress={goNext}
            variant="primary"
            style={styles.primaryBtn}
          />
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    zIndex: 2,
  },
  cardWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    ...Shadows.md,
  },
  iconRing: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 26,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: 34,
  },
  body: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 16,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  bulletBlock: {
    gap: Spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
    opacity: 0.85,
  },
  bulletText: {
    flex: 1,
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.accentForeground,
    lineHeight: 22,
  },
  actions: {
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  navRow: {
    minHeight: 44,
    justifyContent: 'center',
  },
  backTap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  backTapPressed: {
    opacity: 0.7,
  },
  backLabel: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 16,
    color: COLORS.primary,
  },
  backPlaceholder: {
    height: 44,
  },
  primaryBtn: {
    width: '100%',
  },
});
