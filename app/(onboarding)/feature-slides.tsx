import React, { useRef, useState } from 'react';

import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import { router } from 'expo-router';

import { Blob, Button, Page } from '@/components/onboarding/onboarding-primitives';
import { COLORS, Fonts, Radius, Shadows } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SLIDES = [
  {
    id: 1,
    icon: 'notifications-off' as const,
    title: 'Enable Landline Mode',
    description: 'Silence your phone and capture every notification quietly in the background.',
    accentColor: COLORS.primary,
  },
  {
    id: 2,
    icon: 'save-alt' as const,
    title: 'Nothing Gets Lost',
    description: "All your messages are saved. Review them when you're ready — on your schedule.",
    accentColor: COLORS.secondary,
  },
  {
    id: 3,
    icon: 'star' as const,
    title: 'Let the Important Stuff Through',
    description:
      'Set emergency contacts and app bypasses so what truly matters always reaches you.',
    accentColor: '#8B7355',
  },
];

export default function FeatureSlidesScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const slideWidth = width;

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (currentSlide + 1) * slideWidth,
        animated: true,
      });
      setCurrentSlide(currentSlide + 1);
    } else {
      router.push('/create-account');
    }
  };

  const handleSkip = () => {
    router.push('/create-account');
  };

  const slide = SLIDES[currentSlide];

  return (
    <Page
      style={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
      }}
    >
      {/* Ambient blob — color matches current slide */}
      <Blob
        color={slide.accentColor}
        size={280}
        top={-40}
        left={-80}
        opacity={0.08}
        shapeIndex={currentSlide}
      />
      <Blob
        color={COLORS.accent}
        size={200}
        bottom={80}
        right={-60}
        opacity={0.12}
        shapeIndex={2}
      />

      <View style={styles.container}>
        {/* Skip — top right, ghost style */}
        <View style={styles.header}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Carousel */}
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
            listener: (e: any) => {
              const offset = e.nativeEvent.contentOffset.x;
              setCurrentSlide(Math.round(offset / slideWidth));
            },
          })}
          showsHorizontalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
        >
          {SLIDES.map((s) => {
            return (
              <View key={s.id} style={[styles.slide, { width: slideWidth }]}>
                <View style={styles.slideCard}>
                  {/* Icon in organic circle */}
                  <View
                    style={[styles.slideIconContainer, { backgroundColor: `${s.accentColor}15` }]}
                  >
                    <MaterialIcons name={s.icon} size={48} color={s.accentColor} />
                  </View>

                  <View style={styles.textContainer}>
                    <Text style={styles.slideTitle}>{s.title}</Text>
                    <Text style={styles.slideDescription}>{s.description}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </Animated.ScrollView>

        <View style={styles.footer}>
          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {SLIDES.map((_, index) => {
              const dotWidth = scrollX.interpolate({
                inputRange: [
                  (index - 1) * slideWidth,
                  index * slideWidth,
                  (index + 1) * slideWidth,
                ],
                outputRange: [8, 28, 8],
                extrapolate: 'clamp',
              });
              const dotOpacity = scrollX.interpolate({
                inputRange: [
                  (index - 1) * slideWidth,
                  index * slideWidth,
                  (index + 1) * slideWidth,
                ],
                outputRange: [0.3, 1, 0.3],
                extrapolate: 'clamp',
              });
              const dotColor = scrollX.interpolate({
                inputRange: [
                  (index - 1) * slideWidth,
                  index * slideWidth,
                  (index + 1) * slideWidth,
                ],
                outputRange: [COLORS.border, COLORS.primary, COLORS.border],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: dotColor,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Next / Get Started */}
          <Button
            label={currentSlide === SLIDES.length - 1 ? "Let's Go" : 'Next'}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
          />
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingHorizontal: 32,
  },
  footer: {
    paddingHorizontal: 32,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 15,
    color: COLORS.mutedForeground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    justifyContent: 'center',
  },
  slideCard: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 28,
    paddingVertical: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(222, 216, 207, 0.5)',
    ...Shadows.sm,
  },
  slideIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  textContainer: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  slideTitle: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 26,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  slideDescription: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 16,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: Radius.pill,
  },
  nextButton: {
    width: '100%',
  },
});
