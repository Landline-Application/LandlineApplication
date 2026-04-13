import React, { useCallback } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LandlineScreen() {
  const insets = useSafeAreaInsets();

  const {
    hasPermission,
    isActive,
    isLoading,
    checkStatus,
    requestPermission,
    activateLandlineMode,
    deactivateLandlineMode,
  } = useLandlineStore();

  const handleRequestPermission = useCallback(async () => {
    try {
      await requestPermission();
      Alert.alert(
        'Grant Permission',
        'Please enable notification access for this app, then come back to confirm status.',
      );
    } catch {
      console.error('Permission request failed');
    } finally {
      setTimeout(() => {
        checkStatus();
      }, 1000);
    }
  }, [requestPermission, checkStatus]);

  const handleToggleLandlineMode = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Landline Mode requires Notification Access permission. Please grant permission first.',
      );
      return;
    }

    try {
      if (isActive) {
        await deactivateLandlineMode();
        Alert.alert('Landline Mode', 'Landline Mode is now OFF.');
      } else {
        await activateLandlineMode();
        Alert.alert('Landline Mode', 'Landline Mode is now ON.');
      }
    } catch {
      Alert.alert('Error', 'Unable to update Landline Mode. Please try again.');
    }
  }, [hasPermission, isActive, activateLandlineMode, deactivateLandlineMode]);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="phone-in-talk" size={48} color={COLORS.text.muted} />
        <Text style={styles.centerTitle}>Landline Mode</Text>
        <Text style={styles.centerBody}>Landline Mode is only available on Android devices.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.navTitle}>Landline Mode</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Landline Mode</Text>
          <Text style={styles.screenSubtitle}>Capture notifications silently while you focus.</Text>
        </View>

        {/* ── HERO STATUS CARD ── */}
        <Card variant="outlined" shadow="md" padding="lg" borderRadius="xl" style={styles.heroCard}>
          {/* Mode indicator */}
          <View style={styles.heroIndicatorRow}>
            <StatusIndicator
              active={isActive}
              size="lg"
              showGlow={isActive}
              color={isActive ? COLORS.primary : COLORS.text.muted}
            />
            <View style={styles.heroTextGroup}>
              <Text style={styles.heroLabel}>Landline Mode</Text>
              <Text style={[styles.heroState, isActive ? styles.heroStateOn : styles.heroStateOff]}>
                {isActive ? 'On' : 'Off'}
              </Text>
            </View>
          </View>

          {/* Notification access status row */}
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <StatusIndicator
              active={hasPermission}
              size="sm"
              showGlow={false}
              color={hasPermission ? COLORS.success : COLORS.error}
            />
            <Text style={styles.statusRowLabel}>Notification Access</Text>
            <Text
              style={[
                styles.statusRowValue,
                { color: hasPermission ? COLORS.success : COLORS.error },
              ]}
            >
              {hasPermission ? 'Granted' : 'Not granted'}
            </Text>
          </View>

          {/* Primary action — M3 Filled button (highest emphasis, blocking action) */}
          {hasPermission && (
            <View style={styles.heroButtonWrapper}>
              {isLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingLabel}>Updating…</Text>
                </View>
              ) : (
                <Button
                  label={isActive ? 'Turn Landline Mode Off' : 'Turn Landline Mode On'}
                  onPress={handleToggleLandlineMode}
                  variant={isActive ? 'danger' : 'primary'}
                  size="lg"
                  fullWidth
                  disabled={isLoading}
                />
              )}
            </View>
          )}
        </Card>

        {/* ── PERMISSION CARD — M3 Outlined button (medium emphasis, non-blocking) ── */}
        {!hasPermission && (
          <Card
            variant="outlined"
            shadow="sm"
            padding="lg"
            borderRadius="xl"
            style={styles.section}
          >
            <View style={styles.permissionHeader}>
              <View style={styles.permissionIconWrap}>
                <MaterialIcons name="notifications-off" size={20} color={COLORS.warning} />
              </View>
              <Text style={styles.permissionTitle}>Notification Access Needed</Text>
            </View>
            <Text style={styles.bodyText}>
              To use Landline Mode, grant Notification Access. We only use this to log notifications
              while mode is active.
            </Text>
            <View style={styles.permissionButtonWrapper}>
              <Button
                label="Grant Notification Access"
                onPress={handleRequestPermission}
                variant="ghost"
                size="md"
                fullWidth
              />
            </View>
          </Card>
        )}

        {/* ── FOOTER HINT ── */}
        <Text style={styles.footerHint}>
          While Landline Mode is on, notifications are quietly logged. Visit the Notifications tab
          any time to review what you missed.
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  // ── Screen shell ──────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.jumbo,
  },

  // ── Nav bar ───────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    gap: 2,
  },
  backButtonPressed: {
    opacity: 0.65,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  navTitle: {
    flex: 1,
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
    textAlign: 'center',
  },
  navSpacer: {
    width: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
    backgroundColor: COLORS.background,
  },
  centerTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 24,
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  centerBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    marginBottom: Spacing.xxl,
  },
  screenTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 32,
    lineHeight: 40,
    color: COLORS.text.primary,
  },
  screenSubtitle: {
    marginTop: Spacing.xs,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
  },

  // ── Card spacing ──────────────────────────────────────────────────────────
  heroCard: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },

  // ── Hero card ─────────────────────────────────────────────────────────────
  heroIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroTextGroup: {
    flex: 1,
  },
  heroLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.text.muted,
  },
  heroState: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 28,
    lineHeight: 36,
  },
  heroStateOn: {
    color: COLORS.primary,
  },
  heroStateOff: {
    color: COLORS.text.muted,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 32,
  },
  statusRowLabel: {
    flex: 1,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: COLORS.text.primary,
  },
  statusRowValue: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  heroButtonWrapper: {
    marginTop: Spacing.lg,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  loadingLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.text.secondary,
  },

  // ── Permission card ───────────────────────────────────────────────────────
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  permissionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: `${COLORS.warning}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    color: COLORS.text.primary,
    flex: 1,
  },
  permissionButtonWrapper: {
    marginTop: Spacing.md,
  },

  // ── Shared body text ──────────────────────────────────────────────────────
  bodyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.secondary,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footerHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.muted,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
});
