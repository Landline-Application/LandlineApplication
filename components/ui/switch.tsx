import React, { useCallback, useEffect, useRef } from 'react';

import { Animated, Pressable, StyleSheet, ViewStyle } from 'react-native';

import { COLORS, Motion } from '@/constants/theme';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const THUMB_SIZE = 26;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6;

export function Switch({ checked = false, onChange, disabled = false, style }: SwitchProps) {
  const thumbAnim = useRef(new Animated.Value(checked ? THUMB_TRAVEL : 0)).current;
  const trackAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(thumbAnim, {
        toValue: checked ? THUMB_TRAVEL : 0,
        duration: Motion.normal,
        useNativeDriver: true,
      }),
      Animated.timing(trackAnim, {
        toValue: checked ? 1 : 0,
        duration: Motion.normal,
        useNativeDriver: false,
      }),
    ]).start();
  }, [checked, thumbAnim, trackAnim]);

  const trackColor = trackAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.primary],
  });

  const handlePress = useCallback(() => {
    if (!disabled) onChange?.(!checked);
  }, [checked, disabled, onChange]);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
      style={[disabled && styles.disabled, style]}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.thumb, { transform: [{ translateX: thumbAnim }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLORS.background,
    shadowColor: COLORS.shadow.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 2,
  },
});
