import { useCallback, useMemo } from 'react';

import { Dimensions, StyleSheet, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { LinearGradient } from 'expo-linear-gradient';

import { StatusIndicator } from '@/components/ui/status-indicator';
import { COLORS, Shadows } from '@/constants/theme';
import { haptics } from '@/services/haptics';
import Reanimated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

/** Clockwise travel from rest to the finger stop (one digit). */
const MAX_WIND_DEG = 110;
const HOLE_STEP_DEG = 26;

const clockwiseDelta = (fromDeg: number, toDeg: number) => {
  'worklet';
  let delta = toDeg - fromDeg;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
};

const clamp = (value: number, min: number, max: number) => {
  'worklet';
  return Math.min(max, Math.max(min, value));
};

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
  const startAngleDeg = useSharedValue(0);
  const hitFingerStop = useSharedValue(false);
  const lastTickIndex = useSharedValue(0);

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

  const handleToggle = useCallback(() => {
    if (disabled) return;
    if (active) {
      haptics.warning();
    } else {
      haptics.success();
    }
    void onPress?.();
  }, [active, disabled, onPress]);

  const pressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 20, stiffness: 400 });
  }, [scale]);

  const pressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 18, stiffness: 280 });
  }, [scale]);

  const onTick = useCallback(() => {
    haptics.light();
  }, []);

  const onFingerStop = useCallback(() => {
    haptics.rigid();
  }, []);

  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .enabled(!disabled)
      .onBegin(() => {
        runOnJS(pressIn)();
        runOnJS(haptics.rigid)();
      })
      .onFinalize(() => {
        runOnJS(pressOut)();
      })
      .onEnd(() => {
        runOnJS(handleToggle)();
      });

    const pan = Gesture.Pan()
      .enabled(!disabled)
      .minDistance(8)
      .onBegin((event) => {
        cancelAnimation(rotationDeg);
        hitFingerStop.value = false;
        lastTickIndex.value = 0;
        startAngleDeg.value =
          (Math.atan2(event.y - dialCenter, event.x - dialCenter) * 180) / Math.PI;
        runOnJS(pressIn)();
      })
      .onUpdate((event) => {
        const currentAngle =
          (Math.atan2(event.y - dialCenter, event.x - dialCenter) * 180) / Math.PI;
        const wind = clamp(clockwiseDelta(startAngleDeg.value, currentAngle), 0, MAX_WIND_DEG);
        rotationDeg.value = wind;

        const tickIndex = Math.floor(wind / HOLE_STEP_DEG);
        if (tickIndex > lastTickIndex.value) {
          lastTickIndex.value = tickIndex;
          runOnJS(onTick)();
        }

        if (wind >= MAX_WIND_DEG && !hitFingerStop.value) {
          hitFingerStop.value = true;
          runOnJS(onFingerStop)();
        }
      })
      .onFinalize(() => {
        rotationDeg.value = withSpring(0, {
          damping: 14,
          stiffness: 90,
          overshootClamping: true,
        });
        runOnJS(pressOut)();
      });

    return Gesture.Exclusive(pan, tap);
  }, [
    dialCenter,
    disabled,
    handleToggle,
    hitFingerStop,
    lastTickIndex,
    onFingerStop,
    onTick,
    pressIn,
    pressOut,
    rotationDeg,
    startAngleDeg,
  ]);

  const pressableStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const holeLayerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationDeg.value}deg` }],
  }));

  return (
    <View style={[styles.container, style]}>
      <View style={styles.shadowOuter} />

      <GestureDetector gesture={gesture}>
        <Reanimated.View style={[styles.dialBase, pressableStyle]}>
          <LinearGradient
            colors={[COLORS.primary, '#4A5A41', '#3D4A36']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.centerDisplay} pointerEvents="none">
            <LinearGradient colors={['#E6DCCD', '#D6C5B3']} style={StyleSheet.absoluteFill} />
            <StatusIndicator active={active} color={COLORS.primary} size="lg" showGlow={active} />
          </View>

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
        </Reanimated.View>
      </GestureDetector>
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
