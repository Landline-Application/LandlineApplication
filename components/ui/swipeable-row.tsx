import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { COLORS } from '@/constants/theme';
import { haptics } from '@/services/haptics';

const FULL_SWIPE_RATIO = 0.55;

export interface SwipeAction {
  render: () => React.ReactNode;
  backgroundColor?: string;
  width?: number;
  onAction: () => void | Promise<void>;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  onSwipeLeft?: SwipeAction;
  onSwipeRight?: SwipeAction;
  friction?: number;
  containerStyle?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

function ActionButton({
  action,
  swipeableRef,
}: {
  action: SwipeAction;
  swipeableRef: React.RefObject<Swipeable>;
}) {
  const [pending, setPending] = useState(false);

  const handlePress = useCallback(async () => {
    if (pending) return;
    swipeableRef.current?.close();
    setPending(true);
    try {
      await action.onAction();
    } catch {
      swipeableRef.current?.close();
    } finally {
      setPending(false);
    }
  }, [pending, action, swipeableRef]);

  const width = action.width ?? 72;
  const bg = action.backgroundColor ?? COLORS.error;

  return (
    <View style={[styles.track, { width }]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: bg, width },
          (pressed || pending) && styles.buttonPressed,
        ]}
        onPress={handlePress}
        disabled={pending}
        accessibilityRole="button"
      >
        {action.render()}
      </Pressable>
    </View>
  );
}

export default function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
  friction = 1,
  containerStyle,
}: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const rowWidthRef = useRef(0);
  const fullSwipePendingRef = useRef(false);
  const listenerIdRef = useRef<string | null>(null);
  const dragValueRef = useRef<Animated.AnimatedInterpolation<number> | null>(null);
  const thresholdExceededRef = useRef(false);

  useEffect(() => {
    return () => {
      if (dragValueRef.current && listenerIdRef.current) {
        dragValueRef.current.removeListener(listenerIdRef.current);
      }
    };
  }, []);

  const handleFullSwipeLeft = useCallback(async () => {
    if (!onSwipeLeft || fullSwipePendingRef.current) return;
    fullSwipePendingRef.current = true;
    swipeableRef.current?.close();
    try {
      await onSwipeLeft.onAction();
    } finally {
      fullSwipePendingRef.current = false;
    }
  }, [onSwipeLeft]);


  const renderRight = onSwipeLeft
    ? (
        _progress: Animated.AnimatedInterpolation<number>,
        drag: Animated.AnimatedInterpolation<number>,
      ) => {
        // Register drag listener once per drag instance
        if (dragValueRef.current !== drag) {
          if (dragValueRef.current && listenerIdRef.current) {
            dragValueRef.current.removeListener(listenerIdRef.current);
          }
          dragValueRef.current = drag;
          thresholdExceededRef.current = false;
          let lastValue = 0;
          listenerIdRef.current = drag.addListener(({ value }) => {
            const threshold = rowWidthRef.current * FULL_SWIPE_RATIO;

            // Track if threshold was exceeded during the drag
            if (Math.abs(value) > threshold) {
              thresholdExceededRef.current = true;
            }

            // Detect release: when value snaps back to the button width (around -72)
            // This happens after user releases from a large swipe
            if (thresholdExceededRef.current &&
                Math.abs(lastValue) > 100 &&
                Math.abs(value) < 80) {
              thresholdExceededRef.current = false;
              void handleFullSwipeLeft();
            }

            lastValue = value;
          });
        }
        return <ActionButton action={onSwipeLeft} swipeableRef={swipeableRef} />;
      }
    : undefined;

  const renderLeft = onSwipeRight
    ? () => <ActionButton action={onSwipeRight} swipeableRef={swipeableRef} />
    : undefined;

  const swipeableContainerStyle = onSwipeLeft
    ? [{ backgroundColor: onSwipeLeft.backgroundColor ?? COLORS.error }, containerStyle]
    : containerStyle;

  return (
    <View onLayout={(e) => { rowWidthRef.current = e.nativeEvent.layout.width; }}>
      <Swipeable
        ref={swipeableRef}
        friction={friction}
        overshootRight
        overshootFriction={1}
        overshootLeft={!!onSwipeRight}
        useNativeAnimations={false}
        containerStyle={swipeableContainerStyle}
        onSwipeableWillOpen={() => haptics.medium()}
        renderLeftActions={renderLeft}
        renderRightActions={renderRight}
      >
        {children}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  buttonPressed: {
    opacity: 0.88,
  },
});
