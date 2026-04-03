import React, { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { useAutoReplyStore } from '@/hooks/use-auto-reply-store';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { mergeUserPreferences } from '@/utils/firebase/user-service';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function primaryProviderLabel(user: FirebaseAuthTypes.User): string {
  const id = user.providerData?.[0]?.providerId;
  if (id === 'phone') return 'Phone number';
  if (id === 'google.com') return 'Google';
  if (id === 'password') return 'Email & password';
  return 'Account';
}

function accountIdentifier(user: FirebaseAuthTypes.User): string {
  if (user.email) return user.email;
  if (user.phoneNumber) return user.phoneNumber;
  return user.uid;
}

const SWITCH_TRACK_OFF = '#d4c5a0';
const SWITCH_TRACK_ON = '#a89968';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const [savingLandline, setSavingLandline] = useState(false);
  const [savingAutoReply, setSavingAutoReply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    isActive: landlineActive,
    isLoading: landlineLoading,
    activateLandlineMode,
    deactivateLandlineMode,
    checkStatus: checkLandline,
  } = useLandlineStore();

  const {
    isEnabled: autoReplyOn,
    isLoading: autoReplyLoading,
    enable: enableAutoReply,
    disable: disableAutoReply,
    checkStatus: checkAutoReply,
  } = useAutoReplyStore();

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        checkLandline();
        checkAutoReply();
      }
    }, [checkLandline, checkAutoReply]),
  );

  const onRefresh = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    checkLandline();
    checkAutoReply();
    requestAnimationFrame(() => {
      setRefreshing(false);
    });
  }, [checkLandline, checkAutoReply]);

  const handleBack = () => {
    router.back();
  };

  async function persistLandline(next: boolean) {
    if (!user) return;
    setSavingLandline(true);
    try {
      if (next) {
        await activateLandlineMode();
      } else {
        await deactivateLandlineMode();
      }
      await mergeUserPreferences(user.uid, { landlineModeOn: next });
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* haptics unavailable */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update Landline mode.';
      Alert.alert('Landline mode', msg);
    } finally {
      setSavingLandline(false);
      checkLandline();
    }
  }

  async function persistAutoReply(next: boolean) {
    if (!user) return;
    setSavingAutoReply(true);
    try {
      if (next) {
        await enableAutoReply();
      } else {
        await disableAutoReply();
      }
      await mergeUserPreferences(user.uid, { autoReplyEnabled: next });
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        /* haptics unavailable */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update auto-reply.';
      Alert.alert('Auto-reply', msg);
    } finally {
      setSavingAutoReply(false);
      checkAutoReply();
    }
  }

  const android = Platform.OS === 'android';
  const landlineSwitchDisabled = savingLandline || savingAutoReply || landlineLoading;
  const autoReplySwitchDisabled = savingAutoReply || savingLandline || autoReplyLoading;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.textPrimary} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Profile & preferences
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.textPrimary}
            colors={[COLORS.textPrimary]}
          />
        }
      >
        {!isAuthenticated || !user ? (
          <View style={styles.section}>
            <View style={styles.unauthCard}>
              <Text style={styles.unauthTitle}>Sign in required</Text>
              <Text style={styles.unauthSubtitle}>
                Sign in to view your account and sync preferences across devices.
              </Text>
              <Pressable
                style={({ pressed }) => [styles.primaryAuthButton, pressed && styles.primaryPressed]}
                onPress={() => router.push('/create-account')}
              >
                <Text style={styles.primaryAuthButtonText}>Create Account</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.secondaryAuthButton, pressed && styles.secondaryPressed]}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.secondaryAuthButtonText}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Account</Text>
              <View style={styles.accountCard}>
                <View style={styles.accountHeaderRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {(user.displayName?.trim()?.[0] || user.email || user.phoneNumber || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountLabel}>Signed in as</Text>
                    <Text style={styles.accountDisplayName} numberOfLines={1}>
                      {user.displayName?.trim() || 'No display name'}
                    </Text>
                    <Text style={styles.accountMeta} numberOfLines={2} selectable>
                      {accountIdentifier(user)}
                    </Text>
                    <Text style={styles.accountMetaSmall}>
                      Sign-in: {primaryProviderLabel(user)}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => router.push('/(tabs)/settings' as any)}
                  style={({ pressed }) => [styles.editHintPress, pressed && styles.editHintPressed]}
                  accessibilityRole="link"
                  accessibilityLabel="Open Settings to edit display name"
                >
                  <MaterialIcons name="edit" size={16} color={COLORS.activeBorder} />
                  <Text style={styles.accountHint}>Edit display name in Settings</Text>
                  <MaterialIcons name="chevron-right" size={18} color={COLORS.textSecondary} />
                </Pressable>
              </View>

              {user.email && !user.emailVerified ? (
                <View style={styles.verifyBanner}>
                  <MaterialIcons name="info-outline" size={16} color="#996600" />
                  <Text style={styles.verifyBannerText}>
                    Verify your email to secure your account. Check your inbox for a link.
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Preferences</Text>
              <Text style={styles.sectionIntro}>
                Changes save to your account and apply when you sign in on another device. Pull down to
                refresh status.
              </Text>

              {android ? (
                <>
                  <View style={styles.prefCard}>
                    <View style={styles.prefRow}>
                      <View style={styles.prefTextBlock}>
                        <Text style={styles.prefTitle}>Landline mode</Text>
                        <Text style={styles.prefSubtitle}>
                          Focus mode for notifications. Matches the Landline tab.
                        </Text>
                      </View>
                      {landlineLoading && !savingLandline ? (
                        <ActivityIndicator color={COLORS.textPrimary} />
                      ) : savingLandline ? (
                        <ActivityIndicator color={COLORS.textPrimary} />
                      ) : (
                        <Switch
                          value={landlineActive}
                          onValueChange={(v) => void persistLandline(v)}
                          disabled={landlineSwitchDisabled}
                          trackColor={{ false: SWITCH_TRACK_OFF, true: SWITCH_TRACK_ON }}
                          thumbColor={landlineActive ? COLORS.activeBorder : '#f4f3f4'}
                          accessibilityLabel="Landline mode"
                          accessibilityHint="When on, Landline focus mode is active for notifications"
                        />
                      )}
                    </View>
                  </View>

                  <View style={styles.prefCard}>
                    <View style={styles.prefRow}>
                      <View style={styles.prefTextBlock}>
                        <Text style={styles.prefTitle}>Auto-reply</Text>
                        <Text style={styles.prefSubtitle}>
                          Turns automatic replies on or off. You can fine-tune the message in Debug Tools.
                        </Text>
                      </View>
                      {autoReplyLoading && !savingAutoReply ? (
                        <ActivityIndicator color={COLORS.textPrimary} />
                      ) : savingAutoReply ? (
                        <ActivityIndicator color={COLORS.textPrimary} />
                      ) : (
                        <Switch
                          value={autoReplyOn}
                          onValueChange={(v) => void persistAutoReply(v)}
                          disabled={autoReplySwitchDisabled}
                          trackColor={{ false: SWITCH_TRACK_OFF, true: SWITCH_TRACK_ON }}
                          thumbColor={autoReplyOn ? COLORS.activeBorder : '#f4f3f4'}
                          accessibilityLabel="Auto-reply"
                          accessibilityHint="When on, automatic replies are enabled where the system allows"
                        />
                      )}
                    </View>
                  </View>
                </>
              ) : (
                <Text style={styles.platformHint}>
                  Landline mode and auto-reply controls are available on Android. Your saved preferences
                  still sync and apply when you use the app on an Android device.
                </Text>
              )}

              <Pressable
                style={({ pressed }) => [styles.linkButton, pressed && styles.linkButtonPressed]}
                onPress={() => router.push('/permissions' as any)}
                accessibilityRole="button"
                accessibilityLabel="Notifications and permissions"
              >
                <View style={styles.linkIconWrap}>
                  <MaterialIcons name="tune" size={22} color={COLORS.textPrimary} />
                </View>
                <View style={styles.linkButtonTextWrap}>
                  <Text style={styles.linkButtonTitle}>Notifications & permissions</Text>
                  <Text style={styles.linkButtonSub}>
                    Control how Landline can notify you and read notification data.
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color={COLORS.textSecondary} />
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#faf8f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBorder,
    backgroundColor: '#faf8f4',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 10,
    gap: 2,
  },
  backButtonPressed: {
    opacity: 0.65,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 88,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.cardBorder,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: COLORS.textPrimary,
  },
  sectionIntro: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 21,
  },
  accountCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.activeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: COLORS.cardBorder,
  },
  avatarInitial: {
    color: '#F4E4C1',
    fontSize: 22,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  accountDisplayName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  accountMeta: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  accountMetaSmall: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  editHintPress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.cardBorder,
    gap: 6,
  },
  editHintPressed: {
    opacity: 0.7,
  },
  accountHint: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.activeBorder,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#f5d87e',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  verifyBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#996600',
    lineHeight: 17,
  },
  prefCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  prefTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  prefTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  prefSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  platformHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  linkButtonPressed: {
    opacity: 0.92,
    backgroundColor: '#f0ebe0',
  },
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ebe4d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkButtonTextWrap: {
    flex: 1,
  },
  linkButtonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  linkButtonSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  unauthCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  unauthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  unauthSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 18,
  },
  primaryAuthButton: {
    backgroundColor: COLORS.activeBorder,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryPressed: {
    opacity: 0.88,
  },
  primaryAuthButtonText: {
    color: '#F4E4C1',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryAuthButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryPressed: {
    opacity: 0.7,
  },
  secondaryAuthButtonText: {
    color: COLORS.activeBorder,
    fontSize: 16,
    fontWeight: '700',
  },
});
