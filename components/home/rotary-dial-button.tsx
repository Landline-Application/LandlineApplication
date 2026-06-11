import React, { useEffect, useMemo } from 'react';

import { Dimensions, Pressable, StyleSheet, View, ViewStyle } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { StatusIndicator } from '@/components/ui/status-indicator';
import { COLORS, Motion, Shadows } from '@/constants/theme';
import { haptics } from '@/services/haptics';
import Reanimated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// One full rotation per 12 s → 30 deg/s
const SPIN_DURATION_MS = 12000;
const SPIN_DEG_PER_S = 360 / (SPIN_DURATION_MS / 1000);

export interface RotaryDialButtonProps {
  active: boolean;
  onPress: () => void | Promise<void>;
  disabled?: boolean;
  style?: ViewStyle;
}

export const RotaryDialButton = ({
  active,
  onPress,
  disabled = false,
  style,
}: RotaryDialButtonProps) => {
  const scale = useSharedValue(1);
  const rotationDeg = useSharedValue(0);

  const dialSize = width * 0.82;
  const dialCenter = dialSize / 2;
  const holeRadius = width * 0.045;
  const holeDistance = dialCenter * 0.75;

  const holes = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => {
        const angle = (i * 26 + 300) * (Math.PI / 180);
        return {
          id: `hole-${i}`,
          x: dialCenter + holeDistance * Math.cos(angle) - holeRadius,
          y: dialCenter + holeDistance * Math.sin(angle) - holeRadius,
        };
      }),
    [dialCenter, holeDistance, holeRadius],
  );

  useEffect(() => {
    if (active) {
      const current = rotationDeg.value;
      const target = current + 360 * 6000;
      const durationMs = ((target - current) / 360) * SPIN_DURATION_MS;
      rotationDeg.value = withTiming(target, {
        duration: durationMs,
        easing: Easing.linear,
      });
    } else {
      cancelAnimation(rotationDeg);
      rotationDeg.value = withDecay({
        velocity: SPIN_DEG_PER_S,
        deceleration: 0.997,
      });
    }

    return () => {
      cancelAnimation(rotationDeg);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pressableStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const holeLayerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationDeg.value}deg` }],
  }));

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(Motion.scalePress, { damping: 25, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 25, stiffness: 300 });
  };

  const handlePress = async () => {
    if (disabled) return;
    haptics.medium();
    await onPress?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.shadowOuter} />

      <LinearGradient
        colors={[COLORS.primary, '#4A5A41', '#3D4A36']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.dialBase}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          style={StyleSheet.absoluteFill}
        />

        <Reanimated.View style={[styles.centerDisplay, pressableStyle]} pointerEvents="none">
          <LinearGradient colors={['#E6DCCD', '#D6C5B3']} style={StyleSheet.absoluteFill} />
          <StatusIndicator active={active} color={COLORS.primary} size="lg" showGlow={active} />
        </Reanimated.View>

        <Reanimated.View style={[styles.holeLayer, holeLayerStyle]} pointerEvents="none">
          {holes.map((hole) => (
            <View
              key={hole.id}
              style={[
                styles.hole,
                {
                  top: hole.y,
                  left: hole.x,
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.05)']}
                style={StyleSheet.absoluteFill}
              />
            </View>
          ))}
        </Reanimated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width * 0.85,
    height: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shadowOuter: {
    position: 'absolute',
    width: '94%',
    height: '94%',
    borderRadius: (width * 0.82) / 2,
    ...Shadows.xl,
    backgroundColor: 'transparent',
  },
  dialBase: {
    width: width * 0.82,
    height: width * 0.82,
    borderRadius: (width * 0.82) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  centerDisplay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '52%',
    height: '52%',
    marginLeft: -(width * 0.82 * 0.52) / 2,
    marginTop: -(width * 0.82 * 0.52) / 2,
    borderRadius: (width * 0.82 * 0.52) / 2,
    backgroundColor: '#E6DCCD',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  holeLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 20,
  },
  hole: {
    position: 'absolute',
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: (width * 0.09) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
});
