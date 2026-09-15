import React, { useCallback, useRef } from 'react';

import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { COLORS, Motion, Radius, Typography } from '@/constants/theme';

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, style }: ChipProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: Motion.scalePress,
      duration: Motion.fast,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: Motion.fast,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        style={[
          styles.base,
          active ? styles.active : styles.inactive,
          style,
        ]}
      >
        <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  inactive: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  label: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: Typography.bodySm.fontSize,
    fontWeight: '600',
  },
  labelActive: {
    color: COLORS.text.onPrimary,
  },
  labelInactive: {
    color: COLORS.text.secondary,
  },
});
