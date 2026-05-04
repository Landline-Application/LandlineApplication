import React, { useEffect, useState } from 'react';

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useTutorialStore } from '@/hooks/use-tutorial';

export function TutorialReturnHint() {
  const { hasSeenTutorial, isLoaded } = useTutorialStore();
  const [dismissed, setDismissed] = useState(false);

  const show = isLoaded && !hasSeenTutorial && !dismissed;

  useEffect(() => {
    setDismissed(false);
  }, []);

  if (!show) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        style={styles.banner}
        onPress={() => {
          setDismissed(true);
          router.back();
        }}
      >
        <View style={styles.arrowCircle}>
          <MaterialIcons name="arrow-back" size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.text}>Tap here to continue the tutorial</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 82,
    left: 12,
    zIndex: 10000,
    elevation: 10000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Nunito_600SemiBold',
  },
});
