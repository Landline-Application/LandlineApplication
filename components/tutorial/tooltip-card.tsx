import React from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';

interface TooltipCardProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  actionLabel?: string;
  onAction?: () => void;
  interactiveHint?: boolean;
}

export function TooltipCard({
  stepNumber,
  totalSteps,
  title,
  description,
  onNext,
  onBack,
  onSkip,
  isFirst,
  isLast,
  actionLabel,
  onAction,
  interactiveHint,
}: TooltipCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{stepNumber}</Text>
        </View>
        <Pressable onPress={onSkip} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {interactiveHint && (
        <Text style={styles.hintText}>
          Tap the highlighted area to try it out!
        </Text>
      )}

      {onAction && actionLabel && (
        <Pressable style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </Pressable>
      )}

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === stepNumber - 1 && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {!isFirst && (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
          )}
          <Pressable style={styles.nextButton} onPress={onNext}>
            <Text style={styles.nextButtonText}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface.elevated,
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    borderColor: COLORS.accent,
    width: '100%',
    maxWidth: 340,
    ...Shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Nunito_700Bold',
  },
  skipText: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_600SemiBold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
  },
  actionButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.lg,
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Nunito_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.muted,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.surface.base,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  nextButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: COLORS.primary,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Nunito_600SemiBold',
  },
});
