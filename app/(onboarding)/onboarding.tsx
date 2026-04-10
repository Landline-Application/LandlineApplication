import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { Blob, Button, Page } from '@/components/onboarding/onboarding-primitives';
import { COLORS, Fonts, Shadows } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <Page
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 24,
      }}
    >
      {/* Ambient background blobs */}
      <Blob
        color={COLORS.primary}
        size={320}
        top={-60}
        right={-100}
        opacity={0.08}
        shapeIndex={0}
      />
      <Blob
        color={COLORS.secondary}
        size={240}
        bottom={120}
        left={-80}
        opacity={0.1}
        shapeIndex={2}
      />
      <Blob color={COLORS.accent} size={180} top="40%" right={-40} opacity={0.15} shapeIndex={3} />

      {/* Content layer above blobs and grain */}
      <View style={styles.container}>
        {/* Hero content */}
        <View style={styles.heroContent}>
          {/* Organic icon container */}
          <View style={styles.iconContainer}>
            <View style={styles.iconInnerCircle}>
              <MaterialIcons name="call-end" size={48} color={COLORS.primary} />
            </View>
          </View>

          {/* Fraunces serif title */}
          <Text style={styles.title}>Landline</Text>

          {/* Nunito tagline */}
          <Text style={styles.tagline}>Your phone, on your terms.</Text>

          {/* Description */}
          <Text style={styles.subtitle}>
            Capture notifications silently.{'\n'}Review them when you{"'"}re ready.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaContainer}>
          <Button
            label="Get Started"
            onPress={() => router.push('/setup-walkthrough')}
            variant="primary"
            style={styles.ctaButton}
          />

          <Text style={styles.footerHint}>Takes about 2 minutes to set up</Text>
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
    backgroundColor: 'rgba(93, 112, 82, 0.05)',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  iconInnerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(93, 112, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(93, 112, 82, 0.15)',
  },
  title: {
    fontFamily: Fonts?.serifExtraBold ?? 'Fraunces_800ExtraBold',
    fontSize: 52,
    color: COLORS.foreground,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -1,
  },
  tagline: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 20,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 16,
    color: COLORS.mutedForeground,
    textAlign: 'center',
    lineHeight: 26,
  },
  ctaContainer: {
    alignItems: 'center',
    gap: 16,
  },
  ctaButton: {
    width: '100%',
  },
  footerHint: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 13,
    color: COLORS.mutedForeground,
    letterSpacing: 0.2,
  },
});
