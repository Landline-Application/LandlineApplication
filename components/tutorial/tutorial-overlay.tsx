import React, { useEffect, useRef } from 'react';

import { Dimensions, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { TUTORIAL_TOTAL_STEPS, useTutorialStore } from '@/hooks/use-tutorial';
import Reanimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { TooltipCard } from './tooltip-card';
import { useTutorialTargets } from './tutorial-targets-context';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SPOTLIGHT_PADDING = 14;
const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.55)';

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialStep {
  title: string;
  description: string;
  target?: 'dial' | 'logTab' | 'settingsTab';
  action?: {
    label: string;
    route: string;
  };
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Landline!',
    description:
      "Let's take a quick tour so you know exactly how to disconnect from distractions and find peace.",
  },
  {
    title: 'Activate Landline Mode',
    description:
      "Tap the dial to activate Landline Mode. You'll choose between an indefinite session or a timed focus session.",
    target: 'dial',
  },
  {
    title: 'Your Notifications, Saved',
    description:
      'While active, Landline silently captures every notification so nothing is lost. Review them whenever you are ready.',
  },
  {
    title: 'Notification Log',
    description:
      'All captured notifications live here in the Log tab. Tap it any time to see messages, calls, and app alerts.',
    target: 'logTab',
  },
  {
    title: 'Settings & Contacts',
    description:
      'Head to Settings to manage your preferences, permissions, and account details.',
    target: 'settingsTab',
  },
  {
    title: 'Emergency Contacts',
    description:
      'Add the people who matter most. Emergency contacts can still reach you even when Landline Mode is active.',
    action: {
      label: 'Set Up Now',
      route: '/emergency-contacts',
    },
  },
  {
    title: 'Auto-Reply Messages',
    description:
      'Let people know you are taking a break. Set up an automatic reply so no one worries when you do not respond right away.',
    action: {
      label: 'Set Up Now',
      route: '/auto-reply',
    },
  },
  {
    title: "You're All Set!",
    description:
      "Tap Activate whenever you're ready to disconnect. Only emergencies get through, and everything else waits for you.",
  },
];

export function TutorialOverlay() {
  const {
    hasSeenTutorial,
    isLoaded,
    currentStep,
    nextStep,
    prevStep,
    completeTutorial,
    loadTutorialState,
  } = useTutorialStore();
  const { targetRects } = useTutorialTargets();
  const prevStepRef = useRef(currentStep);

  useEffect(() => {
    loadTutorialState();
  }, [loadTutorialState]);

  const visible = isLoaded && !hasSeenTutorial;

  const step = TUTORIAL_STEPS[currentStep];
  const target = step?.target ? targetRects[step.target] : null;

  const overlayOpacity = useSharedValue(0);
  const spotlightX = useSharedValue(0);
  const spotlightY = useSharedValue(0);
  const spotlightW = useSharedValue(0);
  const spotlightH = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      overlayOpacity.value = withTiming(1, { duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const changedStep = prevStepRef.current !== currentStep;
    prevStepRef.current = currentStep;

    if (target) {
      const x = target.x - SPOTLIGHT_PADDING;
      const y = target.y - SPOTLIGHT_PADDING + 55;
      const w = target.width + SPOTLIGHT_PADDING * 2;
      const h = target.height + SPOTLIGHT_PADDING * 2;

      if (changedStep) {
        spotlightX.value = x;
        spotlightY.value = y;
        spotlightW.value = w;
        spotlightH.value = h;
      } else {
        spotlightX.value = withTiming(x, { duration: 200 });
        spotlightY.value = withTiming(y, { duration: 200 });
        spotlightW.value = withTiming(w, { duration: 200 });
        spotlightH.value = withTiming(h, { duration: 200 });
      }
    } else {
      spotlightW.value = changedStep ? 0 : withTiming(0, { duration: 200 });
      spotlightH.value = changedStep ? 0 : withTiming(0, { duration: 200 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, target, visible]);

  const overlayAnimStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // Single-View border mask: the transparent "content" area IS the spotlight,
  // the borders cover the rest of the screen with the dark overlay color.
  const maskStyle = useAnimatedStyle(() => {
    const sw = spotlightW.value;
    const sh = spotlightH.value;

    if (sw <= 0 || sh <= 0) {
      return {
        borderTopWidth: SCREEN_H,
        borderBottomWidth: 0,
        borderLeftWidth: SCREEN_W,
        borderRightWidth: 0,
      };
    }

    const sx = spotlightX.value;
    const sy = spotlightY.value;

    return {
      borderTopWidth: Math.max(0, sy),
      borderBottomWidth: Math.max(0, SCREEN_H - sy - sh),
      borderLeftWidth: Math.max(0, sx),
      borderRightWidth: Math.max(0, SCREEN_W - sx - sw),
    };
  });

  const hasTarget = !!target;
  const spotlightBelow =
    target ? target.y + target.height < SCREEN_H * 0.45 : false;

  const handleNext = () => {
    if (currentStep >= TUTORIAL_TOTAL_STEPS - 1) {
      overlayOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => completeTutorial(), 300);
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    overlayOpacity.value = withTiming(0, { duration: 300 });
    setTimeout(() => completeTutorial(), 300);
  };

  const handleAction = (route: string) => {
    nextStep();
    router.push(route as any);
  };

  if (!visible) return null;

  return (
    <Reanimated.View
      style={[StyleSheet.absoluteFill, styles.overlay, overlayAnimStyle]}
      pointerEvents="box-none"
    >
      {/* Single mask View: borders = dark overlay, content area = transparent spotlight */}
      <Reanimated.View
        style={[styles.mask, maskStyle]}
        pointerEvents="none"
      />

      {/* Tooltip card */}
      <View
        style={[
          styles.tooltipContainer,
          hasTarget && spotlightBelow
            ? styles.tooltipBottom
            : hasTarget
              ? styles.tooltipTop
              : styles.tooltipCenter,
        ]}
        pointerEvents="box-none"
      >
        <TooltipCard
          stepNumber={currentStep + 1}
          totalSteps={TUTORIAL_TOTAL_STEPS}
          title={step.title}
          description={step.description}
          onNext={handleNext}
          onBack={prevStep}
          onSkip={handleSkip}
          isFirst={currentStep === 0}
          isLast={currentStep === TUTORIAL_TOTAL_STEPS - 1}
          actionLabel={step.action?.label}
          onAction={step.action ? () => handleAction(step.action!.route) : undefined}
          interactiveHint={!!target}
        />
      </View>
    </Reanimated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 9999,
    elevation: 9999,
  },
  mask: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: SCREEN_W,
    height: SCREEN_H,
    borderColor: OVERLAY_COLOR,
    backgroundColor: 'transparent',
  },
  tooltipContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tooltipCenter: {
    top: '30%',
  },
  tooltipTop: {
    top: '55%',
  },
  tooltipBottom: {
    bottom: '30%',
  },
});
