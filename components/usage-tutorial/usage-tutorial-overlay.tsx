import React, { useEffect, useState } from 'react';

import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getUsageTutorialSteps } from '@/constants/usage-tutorial';
import { openTutorialTab } from '@/components/usage-tutorial/open-tutorial-tab';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { useUsageTutorialStore, type TutorialSpotlight } from '@/hooks/use-usage-tutorial-store';
import { haptics } from '@/services/haptics';
import { isUsageTutorialPending } from '@/utils/usage-tutorial-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HOLE_PAD = 8;

/**
 * Points at one real control at a time and walks through every tab.
 */
export function UsageTutorialOverlay() {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const visible = useUsageTutorialStore((state) => state.visible);
  const stepIndex = useUsageTutorialStore((state) => state.stepIndex);
  const spotlight = useUsageTutorialStore((state) => state.spotlight);
  const start = useUsageTutorialStore((state) => state.start);
  const back = useUsageTutorialStore((state) => state.back);
  const next = useUsageTutorialStore((state) => state.next);
  const dismiss = useUsageTutorialStore((state) => state.dismiss);
  const [cardHeight, setCardHeight] = useState(168);

  const steps = getUsageTutorialSteps();
  const step = steps[stepIndex];

  useEffect(() => {
    let cancelled = false;
    isUsageTutorialPending()
      .then((pending) => {
        if (!cancelled && pending) {
          start();
        }
      })
      .catch((error) => {
        console.warn('isUsageTutorialPending', error);
      });
    return () => {
      cancelled = true;
    };
  }, [start]);

  useEffect(() => {
    if (!visible || !step) return;
    openTutorialTab(step.screen);
  }, [visible, step]);

  if (!visible || !step) {
    return null;
  }

  const hole = clipHole(
    spotlight && spotlight.id === step.target ? spotlight : null,
    screenH,
  );
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const accent = isDark ? '#B8C4A8' : COLORS.primary;
  const cardTop = placeCard(hole, cardHeight, screenH, insets.top, insets.bottom);

  const handleBack = () => {
    haptics.light();
    back();
  };

  const handleNext = () => {
    haptics.light();
    next();
  };

  const handleSkip = () => {
    haptics.light();
    dismiss();
  };

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      {hole ? (
        <Spotlight hole={hole} screenW={screenW} screenH={screenH} accent={accent} />
      ) : (
        <View style={[styles.scrim, styles.scrimFill]} />
      )}

      <View
        style={[
          styles.card,
          { top: cardTop },
          isDark && { backgroundColor: '#4a4a4a', borderColor: '#3a3a3a' },
        ]}
        onLayout={(event) => {
          const nextHeight = event.nativeEvent.layout.height;
          if (Math.abs(nextHeight - cardHeight) > 1) {
            setCardHeight(nextHeight);
          }
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.stepLabel, { color: accent }]}>
            {stepIndex + 1} of {steps.length}
          </Text>
          <Pressable
            onPress={handleSkip}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip the tour"
          >
            <Text style={[styles.skip, isDark && { color: '#E0E0E0' }]}>Skip</Text>
          </Pressable>
        </View>
        <Text style={[styles.title, isDark && { color: '#FFFFFF' }]}>{step.title}</Text>
        <Text style={[styles.body, isDark && { color: '#F3F3F3' }]}>{step.body}</Text>
        <View style={styles.actions}>
          {isFirst ? (
            <View style={styles.backSpacer} />
          ) : (
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Previous step"
            >
              <Text style={[styles.backLabel, { color: accent }]}>Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: accent }]}
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Finish the tour' : 'Next step'}
          >
            <Text style={[styles.nextLabel, isDark && { color: '#2C2C24' }]}>
              {isLast ? 'Got it' : 'Next'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function clipHole(hole: TutorialSpotlight | null, screenH: number): TutorialSpotlight | null {
  if (!hole) return null;
  const maxH = Math.round(screenH * 0.4);
  if (hole.height <= maxH) return hole;
  return { ...hole, height: maxH };
}

function placeCard(
  hole: TutorialSpotlight | null,
  cardHeight: number,
  screenH: number,
  insetTop: number,
  insetBottom: number,
) {
  const minTop = insetTop + Spacing.sm;
  const maxTop = screenH - cardHeight - insetBottom - Spacing.sm;
  if (!hole) {
    return Math.max(minTop, maxTop);
  }

  const holeTop = hole.y - HOLE_PAD;
  const holeBottom = hole.y + hole.height + HOLE_PAD;
  const spaceAbove = holeTop - minTop;
  const spaceBelow = maxTop + cardHeight - holeBottom;
  const below = holeBottom + Spacing.md;
  const above = holeTop - cardHeight - Spacing.md;
  const preferred = spaceBelow >= cardHeight + Spacing.md || spaceBelow >= spaceAbove ? below : above;
  return Math.max(minTop, Math.min(preferred, maxTop));
}

function Spotlight({
  hole,
  screenW,
  screenH,
  accent,
}: {
  hole: TutorialSpotlight;
  screenW: number;
  screenH: number;
  accent: string;
}) {
  const top = Math.max(0, hole.y - HOLE_PAD);
  const left = Math.max(0, hole.x - HOLE_PAD);
  const right = Math.min(screenW, hole.x + hole.width + HOLE_PAD);
  const bottom = Math.min(screenH, hole.y + hole.height + HOLE_PAD);
  const holeW = Math.max(0, right - left);
  const holeH = Math.max(0, bottom - top);

  return (
    <>
      <View style={[styles.scrim, { top: 0, left: 0, right: 0, height: top }]} />
      <View style={[styles.scrim, { top, left: 0, width: left, height: holeH }]} />
      <View style={[styles.scrim, { top, left: right, right: 0, height: holeH }]} />
      <View style={[styles.scrim, { top: bottom, left: 0, right: 0, bottom: 0 }]} />
      <View
        pointerEvents="none"
        style={[
          styles.ring,
          {
            top,
            left,
            width: holeW,
            height: holeH,
            borderColor: accent,
          },
        ]}
      />
      <View style={[styles.blocker, { top, left, width: holeW, height: holeH }]} />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    elevation: 20,
  },
  scrim: {
    position: 'absolute',
    backgroundColor: 'rgba(44, 44, 36, 0.62)',
  },
  scrimFill: {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: Radius.lg,
  },
  blocker: {
    position: 'absolute',
  },
  card: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  stepLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  skip: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: COLORS.text.secondary,
  },
  title: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 22,
    color: COLORS.foreground,
    marginBottom: Spacing.xs,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  backSpacer: {
    width: 72,
  },
  backButton: {
    minWidth: 72,
    minHeight: 44,
    justifyContent: 'center',
  },
  backLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
  },
  nextButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    color: COLORS.primaryForeground,
  },
});
