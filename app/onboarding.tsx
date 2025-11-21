import { useAuth } from '@/contexts/auth-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

const { width, height } = Dimensions.get("window");

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
    title: "Welcome to Landline",
    description:
      "Stay focused and manage your notifications intelligently with our powerful features.",
    emoji: "📱",
    gradientColors: ["#667eea", "#764ba2"],
  },
  {
    id: 2,
    title: "Landline Mode",
    description:
      "Activate Landline mode to silence distractions while capturing all your notifications for later.",
    emoji: "🔕",
    gradientColors: ["#f093fb", "#f5576c"],
  },
  {
    id: 3,
    title: "Never Miss Important Updates",
    description:
      "Review all notifications you received while in Landline mode, clearly marked and easy to access.",
    emoji: "📬",
    gradientColors: ["#4facfe", "#00f2fe"],
  },
  {
    id: 4,
    title: "Background Services",
    description:
      "Our smart background services keep the app running efficiently while minimizing battery usage.",
    emoji: "⚡",
    gradientColors: ["#43e97b", "#38f9d7"],
  },
  {
    id: 5,
    title: "Grant Permissions",
    description:
      "To work properly, we need notification access and the ability to run in the background.",
    emoji: "🔐",
    gradientColors: ["#fa709a", "#fee140"],
  },
  {
    id: 6,
    title: 'Create Your Account',
    description: 'Sign up with your email to get started and sync your preferences across devices.',
    emoji: '👤',
    gradientColors: ['#667eea', '#764ba2'],
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useSharedValue(0);
  const { signUp } = useAuth();
  
  // Signup form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    scrollX.value = offsetX;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    // Validate inputs
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    
    try {
      // Use the auth context to sign up
      await signUp(email, password);
      
      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: width * (currentIndex + 1),
        animated: true,
      });
    } else {
<<<<<<< HEAD
      // On the signup screen, validate and submit
      handleSignup();
=======
      // Navigate to main app
      router.replace("/(tabs)");
>>>>>>> origin/main
    }
  };

  const handleSkip = () => {
<<<<<<< HEAD
    // If on signup screen, allow skip as well
    router.replace('/(tabs)');
=======
    router.replace("/(tabs)");
>>>>>>> origin/main
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Skip button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
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
<<<<<<< HEAD
              colors={slide.gradientColors as [string, string, ...string[]]}
=======
              colors={slide.gradientColors as [ColorValue, ColorValue]}
>>>>>>> origin/main
              style={styles.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.content}>
                <View style={styles.emojiContainer}>
                  <Text style={styles.emoji}>{slide.emoji}</Text>
                </View>

                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.description}>{slide.description}</Text>

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

                {slide.id === 6 && (
                  <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.signupForm}
                  >
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email Address</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="your.email@example.com"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="At least 8 characters"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Re-enter your password"
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                    </View>

                    <Text style={styles.termsText}>
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </Text>
                  </KeyboardAvoidingView>
                )}
              </View>
            </LinearGradient>
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
<<<<<<< HEAD
        {slides.map((_, index) => (
          <PaginationDot key={index} index={index} scrollX={scrollX} />
        ))}
=======
        {slides.map((_, index) => {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const dotStyle = useAnimatedStyle(() => {
            const inputRange = [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ];

            const scale = interpolate(
              scrollX.value,
              inputRange,
              [0.8, 1.4, 0.8],
              Extrapolation.CLAMP,
            );

            const opacity = interpolate(
              scrollX.value,
              inputRange,
              [0.4, 1, 0.4],
              Extrapolation.CLAMP,
            );

            return {
              transform: [{ scale }],
              opacity,
            };
          });

          return <Animated.View key={index} style={[styles.dot, dotStyle]} />;
        })}
>>>>>>> origin/main
      </View>

      {/* Next/Get Started button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.nextButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.nextButtonText}>
<<<<<<< HEAD
            {currentIndex === slides.length - 1 ? (isLoading ? 'Creating Account...' : 'Sign Up') : 'Next'}
=======
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
>>>>>>> origin/main
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// Feature item component
function FeatureItem({ text }: { text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.checkmark}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>
      <Text style={styles.featureText}>{text}</Text>
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
        <Text style={styles.permissionIconText}>{icon}</Text>
      </View>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
      </View>
    </View>
  );
}

// Pagination dot component
function PaginationDot({ index, scrollX }: { index: number; scrollX: ReturnType<typeof useSharedValue> }) {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1.4, 0.8],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[styles.dot, dotStyle]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  slide: {
    width,
    height,
  },
  gradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
    paddingBottom: 200,
  },
  emojiContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 30,
  },
  featureList: {
    width: "100%",
    marginTop: 20,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 12,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkmarkText: {
    color: "#4facfe",
    fontSize: 16,
    fontWeight: "bold",
  },
  featureText: {
    color: "#fff",
    fontSize: 16,
    flex: 1,
    fontWeight: "500",
  },
  permissionsList: {
    width: "100%",
    marginTop: 20,
  },
  permissionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 20,
    borderRadius: 16,
  },
  permissionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  permissionIconText: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  permissionDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 140,
    alignSelf: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    marginHorizontal: 6,
  },
  nextButton: {
    position: "absolute",
    bottom: 50,
    left: 40,
    right: 40,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  signupForm: {
    width: '100%',
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    paddingLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  termsText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
});
