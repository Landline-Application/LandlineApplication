import React, { useCallback, useState } from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Permission, PermissionCards, usePermissions } from '@/components/permissions';
import { COLORS, Fonts, Radius, Spacing } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CorePermissionsScreen() {
  const insets = useSafeAreaInsets();
  const [reqGranted, setReqGranted] = useState(0);
  const [reqTotal, setReqTotal] = useState(0);

  const handlePermissionsChanged = useCallback(
    (granted: boolean, current: number, total: number) => {
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

  const progress = reqTotal > 0 ? reqGranted / reqTotal : 0;

  return (
    <View style={styles.container}>
      {/* Header with Back Arrow */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>Permissions</Text>
          <Text style={styles.headerSubtitle}>System access settings</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {reqGranted} of {reqTotal} required permissions granted
          </Text>
        </View>

        <PermissionCards
          permissions={permissions}
          isLoading={isLoading}
          onRequestPermission={handleRequestPermission}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginBottom: 24,
    paddingHorizontal: 4,
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
});
