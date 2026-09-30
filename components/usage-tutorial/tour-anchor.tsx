import React, { useCallback, useEffect, useRef } from 'react';

import {
  ScrollView,
  View,
  type NativeMethods,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useIsFocused } from 'expo-router';

import { getUsageTutorialSteps } from '@/constants/usage-tutorial';
import { useUsageTutorialStore } from '@/hooks/use-usage-tutorial-store';

interface TourScroller {
  scrollTo: (y: number) => void;
  getOffset: () => number;
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

const scrollers = new Map<string, TourScroller>();

function registerTourScroller(key: string, scroller: TourScroller | null) {
  if (scroller) {
    scrollers.set(key, scroller);
  } else {
    scrollers.delete(key);
  }
}

interface TourAnchorProps {
  id: string;
  children: React.ReactNode;
  /** When set, scroll this list so the anchor is on screen before it is highlighted. */
  scrollKey?: string;
  /**
   * Screen controls stay hidden until their tab is focused, so a step cannot
   * highlight the dial while Settings is still showing. Tab buttons stay visible
   * on every tab, so they opt out.
   */
  requireFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Marks a real control the usage tour can point at.
 * Measures itself in window coordinates whenever it is the active step.
 */
export function TourAnchor({
  id,
  children,
  scrollKey,
  requireFocus = true,
  style,
}: TourAnchorProps) {
  const ref = useRef<View>(null);
  const focused = useIsFocused();
  const visible = useUsageTutorialStore((state) => state.visible);
  const stepIndex = useUsageTutorialStore((state) => state.stepIndex);
  const steps = getUsageTutorialSteps();
  const active = visible && steps[stepIndex]?.target === id && (!requireFocus || focused);

  const publish = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) => {
      if (width <= 0 || height <= 0) return;
      useUsageTutorialStore.getState().setSpotlight({ id, x, y, width, height });
    });
  }, [id]);

  const reveal = useCallback(() => {
    const node = ref.current;
    const scroller = scrollKey ? scrollers.get(scrollKey) : undefined;
    if (!node || !scroller) {
      publish();
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      scroller.measureInWindow((sx, sy, _sw, sh) => {
        const topLimit = sy + 72;
        let delta = y - topLimit;
        if (height > sh * 0.55) {
          delta = y - (sy + 16);
        }

        if (Math.abs(delta) > 8) {
          scroller.scrollTo(Math.max(0, scroller.getOffset() + delta));
          setTimeout(publish, 60);
          return;
        }
        useUsageTutorialStore.getState().setSpotlight({ id, x, y, width, height });
      });
    });
  }, [id, publish, scrollKey]);

  useEffect(() => {
    if (!active) return;
    const timers = [0, 80, 240, 480].map((delay) => setTimeout(reveal, delay));
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [active, reveal]);

  return (
    <View ref={ref} collapsable={false} onLayout={active ? reveal : undefined} style={style}>
      {children}
    </View>
  );
}

type TourScrollViewProps = ScrollViewProps & {
  scrollKey: string;
};

/** ScrollView the tour can move so an off-screen anchor lines up with its callout. */
export function TourScrollView({ scrollKey, onScroll, ...rest }: TourScrollViewProps) {
  const offset = useRef(0);

  const setRef = useCallback(
    (node: ScrollView | null) => {
      if (!node) {
        registerTourScroller(scrollKey, null);
        return;
      }
      registerTourScroller(scrollKey, {
        scrollTo: (y) => node.scrollTo({ y, animated: false }),
        getOffset: () => offset.current,
        measureInWindow: (callback) => {
          (node as unknown as NativeMethods).measureInWindow(callback);
        },
      });
    },
    [scrollKey],
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
    onScroll?.(event);
  };

  return <ScrollView ref={setRef} onScroll={handleScroll} scrollEventThrottle={16} {...rest} />;
}
