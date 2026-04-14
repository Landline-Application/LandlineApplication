import React, { useEffect, useMemo, useRef } from 'react';

import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { StatusIndicator } from '@/components/ui/status-indicator';
import { COLORS, Motion, Shadows } from '@/constants/theme';
import { haptics } from '@/services/haptics';

const { width } = Dimensions.get('window');

// One full rotation per 12 s → 30 deg/s
const SPIN_DURATION_MS = 12000;

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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const spinRef = useRef<Animated.CompositeAnimation | null>(null);

  const dialSize = width * 0.82;
  const dialCenter = dialSize / 2;
  const holeRadius = width * 0.045;
  const holeDistance = dialCenter * 0.72;

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
    const run = (fn: (deg: number) => void) => {
      rotationAnim.stopAnimation((raw) => {
        const deg = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
        fn(deg);
      });
    };

    spinRef.current?.stop?.();
    spinRef.current = null;

    if (active) {
      run((start) => {
        rotationAnim.setValue(start);
        const delta = 360 * 6000;
        const durationMs = (delta / 360) * SPIN_DURATION_MS;
        const spin = Animated.timing(rotationAnim, {
          toValue: start + delta,
          duration: durationMs,
          easing: Easing.linear,
          useNativeDriver: true,
        });
        spinRef.current = spin;
        spin.start();
      });
    } else {
      run((start) => {
        rotationAnim.setValue(start);
        const coast = Animated.timing(rotationAnim, {
          toValue: start + 90,
          duration: 2800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        });
        spinRef.current = coast;
        coast.start();
      });
    }

    return () => {
      spinRef.current?.stop?.();
      spinRef.current = null;
      rotationAnim.stopAnimation();
    };
  }, [active, rotationAnim]);

  const pressableStyle = {
    transform: [{ scale: scaleAnim }],
  };

  const holeRotate = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  const holeLayerStyle = {
    transform: [{ rotate: holeRotate }],
  };

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: Motion.scalePress,
      damping: 25,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      damping: 25,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
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
        <Animated.View style={[styles.pressable, pressableStyle]}>
          <Pressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.centerDisplay} pointerEvents="none">
            <LinearGradient colors={['#E6DCCD', '#D6C5B3']} style={StyleSheet.absoluteFill} />
            <View style={styles.centerBezel} />
            <StatusIndicator active={active} color={COLORS.primary} size="lg" showGlow={active} />
          </View>

          <Animated.View style={[styles.holeLayer, holeLayerStyle]} pointerEvents="none">
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
                  colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.02)']}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            ))}
          </Animated.View>
        </Animated.View>
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
  pressable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerDisplay: {
    width: '52%',
    height: '52%',
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
  centerBezel: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  holeLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hole: {
    position: 'absolute',
    width: width * 0.09,
    height: width * 0.09,
    borderRadius: (width * 0.09) / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
});
