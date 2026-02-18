import React, { useRef, useState } from 'react';

import {
  ColorValue,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  emoji: string;
  gradientColors: string[];
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Welcome to Landline',
    description:
      'Stay focused and manage your notifications intelligently with our powerful features.',
    emoji: '📱',
    gradientColors: ['#667eea', '#764ba2'],
  },
  {
    id: 2,
    title: 'Landline Mode',
    description:
      'Activate Landline mode to silence distractions while capturing all your notifications for later.',
    emoji: '🔕',
    gradientColors: ['#f093fb', '#f5576c'],
  },
  {
    id: 3,
    title: 'Never Miss Important Updates',
    description:
      'Review all notifications you received while in Landline mode, clearly marked and easy to access.',
    emoji: '📬',
    gradientColors: ['#4facfe', '#00f2fe'],
  },
  {
    id: 4,
    title: 'Background Services',
    description:
      'Our smart background services keep the app running efficiently while minimizing battery usage.',
    emoji: '⚡',
    gradientColors: ['#43e97b', '#38f9d7'],
  },
  {
    id: 5,
    title: 'Grant Permissions',
    description:
      'To work properly, we need notification access and the ability to run in the background.',
    emoji: '🔐',
    gradientColors: ['#fa709a', '#fee140'],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
      // Navigate to create account page
      router.replace('/create-account');
    }
  };

  const handleSkip = () => {
    router.replace('/create-account');
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Skip button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          style={[styles.skipButton, { top: insets.top + 10 }]}
          onPress={handleSkip}
        >
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {slides.map((slide, _index) => (
          <View key={slide.id} style={styles.slide}>
            <LinearGradient
              colors={slide.gradientColors as [ColorValue, ColorValue]}
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.content}>
                <View style={styles.emojiContainer}>
                  <ThemedText style={styles.emoji}>{slide.emoji}</ThemedText>
                </View>

                <ThemedText style={styles.title}>{slide.title}</ThemedText>
                <ThemedText style={styles.description}>{slide.description}</ThemedText>

                {/* Feature highlights for specific slides */}
                {slide.id === 2 && (
                  <View style={styles.featureList}>
                    <FeatureItem text="Silent notifications during focus time" />
                    <FeatureItem text="Auto-capture all incoming alerts" />
                    <FeatureItem text="Review later at your convenience" />
                  </View>
                )}

                {slide.id === 5 && (
                  <View style={styles.permissionsList}>
                    <PermissionItem
                      icon="🔔"
                      title="Notification Access"
                      description="Read and log notifications"
                    />
                    <PermissionItem
                      icon="⚙️"
                      title="Background Services"
                      description="Run efficiently in background"
                    />
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={[styles.pagination, { bottom: insets.bottom + 100 }]}>
        {slides.map((_, index) => (
          <PaginationDot key={index} index={index} scrollX={scrollX} />
        ))}
      </View>

      {/* Next/Get Started button */}
      <TouchableOpacity
        style={[styles.nextButton, { bottom: insets.bottom + 20 }]}
        onPress={handleNext}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.nextButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <ThemedText style={styles.nextButtonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </ThemedText>
        </LinearGradient>
      </TouchableOpacity>
    </ThemedView>
  );
}

// Pagination dot component — hook must live at top level of a component, not inside .map()
function PaginationDot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const scale = interpolate(scrollX.value, inputRange, [0.8, 1.4, 0.8], Extrapolation.CLAMP);

    const opacity = interpolate(scrollX.value, inputRange, [0.4, 1, 0.4], Extrapolation.CLAMP);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, dotStyle]} />;
}

// Feature item component
function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.checkmark}>
        <ThemedText style={styles.checkmarkText}>✓</ThemedText>
      </View>
      <ThemedText style={styles.featureText}>{text}</ThemedText>
    </View>
  );
}

// Permission item component
function PermissionItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.permissionItem}>
      <View style={styles.permissionIcon}>
        <ThemedText style={styles.permissionIconText}>{icon}</ThemedText>
      </View>
      <View style={styles.permissionContent}>
        <ThemedText style={styles.permissionTitle}>{title}</ThemedText>
        <ThemedText style={styles.permissionDescription}>{description}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  skipButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width,
    height,
    backgroundColor: 'transparent',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
    paddingBottom: 200,
    backgroundColor: 'transparent',
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
  },
  featureList: {
    width: '100%',
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 16,
    borderRadius: 12,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmarkText: {
    color: '#4facfe',
    fontSize: 16,
    fontWeight: 'bold',
  },
  featureText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
    fontWeight: '500',
  },
  permissionsList: {
    width: '100%',
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 16,
  },
  permissionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  permissionIconText: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  permissionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginHorizontal: 6,
  },
  nextButton: {
    position: 'absolute',
    left: 40,
    right: 40,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
