import React, { useCallback, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/core/button';
import { Blob, Page } from '@/components/onboarding/onboarding-primitives';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { Permission, PermissionCards, usePermissions } from '@/components/permissions';
import { COLORS, Fonts, Radius } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const [allGranted, setAllRequiredGranted] = useState(false);
  const [reqGranted, setReqGranted] = useState(0);
  const [reqTotal, setReqTotal] = useState(0);

  const handlePermissionsChanged = useCallback(
    (granted: boolean, current: number, total: number) => {
      setAllRequiredGranted(granted);
      setReqGranted(current);
      setReqTotal(total);
    },
    [],
  );

  const { permissions, isLoading, checkAllPermissions, checkStatus } = usePermissions({
    onPermissionsChanged: handlePermissionsChanged,
  });

  const handleRequestPermission = useCallback(
    async (permission: Permission) => {
      const granted = await permission.requestPermission();
      await checkAllPermissions();

      if (granted) {
        await checkStatus();
      }
    },
    [checkAllPermissions, checkStatus],
  );

  const handleContinue = useCallback(() => {
    if (allGranted) {
      router.push('/create-account');
    }
  }, [allGranted]);

  const progress = reqTotal > 0 ? reqGranted / reqTotal : 0;

  return (
    <Page
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <Blob color={COLORS.primary} size={200} top={-40} right={-60} opacity={0.06} shapeIndex={1} />

      <View style={styles.container}>
        <OnboardingProgress total={3} current={0} labels={['Permissions', 'Account', 'Privacy']} />

        <View style={styles.header}>
          <Text style={styles.title}>A few things first</Text>
          <Text style={styles.subtitle}>Landline needs these permissions to work its magic.</Text>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {reqGranted} of {reqTotal} required
          </Text>
        </View>

        <View style={styles.content}>
          <PermissionCards
            permissions={permissions}
            isLoading={isLoading}
            onRequestPermission={handleRequestPermission}
          />
        </View>

        <View style={styles.bottomAction}>
          <Button
            label="Continue"
            onPress={handleContinue}
            variant="primary"
            disabled={!allGranted || isLoading}
            fullWidth
          />
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 2,
  },
  header: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: Fonts?.serifBold ?? 'Fraunces_700Bold',
    fontSize: 30,
    color: COLORS.foreground,
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 16,
    color: COLORS.mutedForeground,
    marginBottom: 12,
    lineHeight: 24,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: Radius.pill,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: Radius.pill,
  },
  progressLabel: {
    fontFamily: Fonts?.sansMedium ?? 'Nunito_500Medium',
    fontSize: 13,
    color: COLORS.mutedForeground,
  },
  bottomAction: {
    paddingVertical: 16,
  },
});
