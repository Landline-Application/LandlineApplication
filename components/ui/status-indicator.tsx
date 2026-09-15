import React, { useEffect, useRef } from 'react';

import { Animated, Easing, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS, Motion } from '@/constants/theme';

export interface StatusIndicatorProps {
  active: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
  style?: ViewStyle;
}

const sizeMap = {
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const StatusIndicator = ({
  active,
  color = COLORS.primary,
  size = 'md',
  showGlow = true,
  style,
}: StatusIndicatorProps) => {
  const glowAnim = useRef(new Animated.Value(active ? 1 : 0.4)).current;

  const indicatorSize = sizeMap[size];
  const glowSize = indicatorSize * 2.5;

  useEffect(() => {
    if (active && showGlow) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: Motion.slow * 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: Motion.slow * 2,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();

      return () => {
        animation.stop();
      };
    } else {
      glowAnim.setValue(active ? 0.8 : 0.4);
    }
  }, [active, glowAnim, showGlow]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0.4, 1],
    outputRange: [0.12, 0.4],
  });

  return (
    <View style={[styles.container, style]}>
      {showGlow && (
        <Animated.View
          style={{
            position: 'absolute',
            top: (indicatorSize - glowSize) / 2,
            left: (indicatorSize - glowSize) / 2,
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: color,
            opacity: glowOpacity,
          }}
        />
      )}
      <View
        style={{
          width: indicatorSize,
          height: indicatorSize,
          borderRadius: indicatorSize / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: active && showGlow ? 0 : 0.3,
          shadowRadius: 3,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
