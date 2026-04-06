import React, { useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { Button } from '@/components/core/button';
import { Card } from '@/components/core/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAutoReplyStore } from '@/hooks/use-auto-reply-store';
import { haptics } from '@/services/haptics';
import {
  RETENTION_OPTIONS,
  type RetentionDays,
  formatNextCleanupRelative,
  getLastCleanupTimestamp,
  getRetentionLabel,
  getRetentionPeriod,
  setRetentionPeriod,
} from '@/services/notification-retention';
import { deleteAccountWithEmail } from '@/utils/firebase/auth';
import { deleteAccountWithGoogle } from '@/utils/firebase/google-auth';
import { updateUserDisplayName } from '@/utils/firebase/user-service';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
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
  const { user, isAuthenticated, refreshUser, signOut, resetPassword } = useAuth();
  const [savingAutoReply, setSavingAutoReply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Display name editing
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName?.trim() ?? '');
  const [savingDisplayName, setSavingDisplayName] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // Delete account modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  // Retention settings
  const [retentionDays, setRetentionDays] = useState<RetentionDays>(30);
  const [nextCleanupText, setNextCleanupText] = useState<string>('');
  const [retentionModalVisible, setRetentionModalVisible] = useState(false);
  const [selectedRetentionOption, setSelectedRetentionOption] = useState<RetentionDays>(30);

  const isEmailUser = user?.providerData?.some((p) => p.providerId === 'password') ?? false;

  const {
    isEnabled: autoReplyOn,
    isLoading: autoReplyLoading,
    enable: enableAutoReply,
    disable: disableAutoReply,
    checkStatus: checkAutoReply,
  } = useAutoReplyStore();

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      checkAutoReply();
    }
  }, [checkAutoReply]);

  // Load retention settings on mount
  React.useEffect(() => {
    async function loadRetentionSettings() {
      try {
        const days = getRetentionPeriod();
        const lastCleanup = await getLastCleanupTimestamp();
        setRetentionDays(days);
        setSelectedRetentionOption(days);
        setNextCleanupText(formatNextCleanupRelative(days, lastCleanup));
      } catch (error) {
        console.error('Error loading retention settings:', error);
      }
    }
    loadRetentionSettings();
  }, []);

  function openRetentionModal() {
    setSelectedRetentionOption(retentionDays);
    setRetentionModalVisible(true);
  }

  function closeRetentionModal() {
    setRetentionModalVisible(false);
  }

  async function handleSaveRetention() {
    try {
      setRetentionPeriod(selectedRetentionOption);
      setRetentionDays(selectedRetentionOption);
      const lastCleanup = await getLastCleanupTimestamp();
      setNextCleanupText(formatNextCleanupRelative(selectedRetentionOption, lastCleanup));
      closeRetentionModal();
      haptics.light();
    } catch (error) {
      console.error('Error saving retention period:', error);
      Alert.alert('Error', 'Failed to save retention settings');
    }
  }

  const onRefresh = React.useCallback(async () => {
    if (Platform.OS !== 'android') {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    checkAutoReply();
    requestAnimationFrame(() => {
      setRefreshing(false);
    });
  }, [checkAutoReply]);

  const handleBack = () => {
    router.back();
  };

  async function persistAutoReply(next: boolean) {
    if (!user) return;
    setSavingAutoReply(true);
    try {
      if (next) {
        await enableAutoReply();
      } else {
        await disableAutoReply();
      }
      haptics.success();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update auto-reply.';
      Alert.alert('Auto-reply', msg);
    } finally {
      setSavingAutoReply(false);
      checkAutoReply();
    }
  }

  async function handleSaveDisplayName() {
    if (!user) return;
    setSavingDisplayName(true);
    try {
      await updateUserDisplayName(user, displayNameInput);
      await refreshUser();
      setIsEditingName(false);
      haptics.success();
    } catch (error) {
      console.error('Save display name:', error);
      Alert.alert(
        'Error',
        'Could not save your display name. Check your connection and try again.',
      );
    } finally {
      setSavingDisplayName(false);
    }
  }

  async function handleChangePassword() {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      Alert.alert(
        'Reset email sent',
        `We've sent a password reset link to ${user.email}. Check your inbox.`,
        [{ text: 'OK' }],
      );
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/too-many-requests') {
        Alert.alert('Too many attempts', 'Please try again later.');
      } else {
        Alert.alert(
          'Error',
          (error as Error)?.message || 'Could not send reset email. Please try again.',
        );
      }
    }
  }

  function openDeleteModal() {
    Alert.alert(
      'Delete Account',
      'This is permanent. Your account cannot be recovered once deleted. Are you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, delete it',
          style: 'destructive',
          onPress: () => {
            setDeleteModalVisible(true);
            setConfirmationText('');
            setDeletePassword('');
          },
        },
      ],
    );
  }

  function closeDeleteModal() {
    setDeleteModalVisible(false);
    setConfirmationText('');
    setDeletePassword('');
  }

  async function handleDeleteAccount() {
    if (!user) return;

    const providers = user.providerData?.map((p) => p.providerId) ?? [];
    const isEmailProvider = providers.includes('password');
    const isGoogleProvider = providers.includes('google.com');

    if (isEmailProvider) {
      if (confirmationText !== 'DELETE') {
        Alert.alert('Incorrect Confirmation', 'Please type "DELETE" to confirm.');
        return;
      }
      if (!deletePassword) {
        Alert.alert('Password Required', 'Please enter your password to confirm deletion.');
        return;
      }
    }

    setIsDeleting(true);
    try {
      if (isEmailProvider) {
        await deleteAccountWithEmail(user, deletePassword);
      } else if (isGoogleProvider) {
        await deleteAccountWithGoogle(user);
      } else {
        Alert.alert('Unsupported', 'Cannot delete this account type from the app.');
        setIsDeleting(false);
        return;
      }

      await signOut().catch(() => {});
      closeDeleteModal();
      router.replace('/onboarding');
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        Alert.alert('Wrong Password', 'The password you entered is incorrect.');
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'Too many failed attempts. Please try again later.');
      } else {
        Alert.alert('Delete Failed', (error as Error)?.message || 'An unexpected error occurred.');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  const android = Platform.OS === 'android';
  const autoReplySwitchDisabled = savingAutoReply || autoReplyLoading;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Profile
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {!isAuthenticated || !user ? (
          <View style={styles.section}>
            <Card variant="elevated" padding="lg" style={styles.unauthCard}>
              <Text style={styles.unauthTitle}>Sign in required</Text>
              <Text style={styles.unauthSubtitle}>
                Sign in to view your account and sync preferences across devices.
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryAuthButton,
                  pressed && styles.primaryPressed,
                ]}
                onPress={() => router.push('/auth/create-account')}
              >
                <Text style={styles.primaryAuthButtonText}>Create Account</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryAuthButton,
                  pressed && styles.secondaryPressed,
                ]}
                onPress={() => router.push('/auth/sign-in')}
              >
                <Text style={styles.secondaryAuthButtonText}>Sign In</Text>
              </Pressable>
            </Card>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Account</Text>
              <Card variant="elevated" padding="lg" style={styles.accountCard}>
                <View style={styles.accountHeaderRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitial}>
                      {(user.displayName?.trim()?.[0] ||
                        user.email ||
                        user.phoneNumber ||
                        '?')[0].toUpperCase()}
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

                {/* Display Name Editing */}
                {isEditingName ? (
                  <View style={styles.editNameContainer}>
                    <Text style={styles.inputLabel}>Display Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={displayNameInput}
                      onChangeText={setDisplayNameInput}
                      placeholder="e.g. Alex M."
                      placeholderTextColor={COLORS.text.muted}
                      editable={!savingDisplayName}
                      maxLength={80}
                      autoFocus
                    />
                    <View style={styles.editNameButtons}>
                      <Button
                        label="Cancel"
                        onPress={() => {
                          setIsEditingName(false);
                          setDisplayNameInput(user?.displayName?.trim() ?? '');
                        }}
                        variant="ghost"
                        size="sm"
                        style={{ flex: 1 }}
                      />
                      <Button
                        label={savingDisplayName ? 'Saving...' : 'Save'}
                        onPress={handleSaveDisplayName}
                        disabled={savingDisplayName || !displayNameInput.trim()}
                        variant="primary"
                        size="sm"
                        style={{ flex: 1 }}
                      />
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setIsEditingName(true)}
                    style={({ pressed }) => [
                      styles.editHintPress,
                      pressed && styles.editHintPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Edit display name"
                  >
                    <MaterialIcons name="edit" size={16} color={COLORS.primary} />
                    <Text style={styles.accountHint}>Edit display name</Text>
                    <MaterialIcons name="chevron-right" size={18} color={COLORS.text.muted} />
                  </Pressable>
                )}
              </Card>

              {user.email && !user.emailVerified ? (
                <View style={styles.verifyBanner}>
                  <MaterialIcons name="info-outline" size={16} color={COLORS.secondary} />
                  <Text style={styles.verifyBannerText}>
                    Verify your email to secure your account. Check your inbox for a link.
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Preferences</Text>
              <Text style={styles.sectionIntro}>
                Changes save to your account and apply when you sign in on another device. Pull down
                to refresh status.
              </Text>

              {android ? (
                <Card variant="elevated" padding="md" style={styles.prefCard}>
                  <View style={styles.prefRow}>
                    <View style={styles.prefTextBlock}>
                      <Text style={styles.prefTitle}>Auto-reply</Text>
                      <Text style={styles.prefSubtitle}>
                        Turns automatic replies on or off. You can fine-tune the message in Debug
                        Tools.
                      </Text>
                    </View>
                    <View style={styles.toggleContainer}>
                      {autoReplyLoading || savingAutoReply ? (
                        <ActivityIndicator color={COLORS.primary} style={styles.toggleLoader} />
                      ) : (
                        <Switch
                          value={autoReplyOn}
                          onValueChange={(v) => void persistAutoReply(v)}
                          disabled={autoReplySwitchDisabled}
                          trackColor={{ false: SWITCH_TRACK_OFF, true: SWITCH_TRACK_ON }}
                          thumbColor={autoReplyOn ? COLORS.primary : '#f4f3f4'}
                          accessibilityLabel="Auto-reply"
                          accessibilityHint="When on, automatic replies are enabled where the system allows"
                        />
                      )}
                    </View>
                  </View>
                </Card>
              ) : (
                <Text style={styles.platformHint}>
                  Auto-reply controls are available on Android. Your saved preferences still sync
                  and apply when you use the app on an Android device.
                </Text>
              )}

              {/* Retention Period Setting */}
              <TouchableOpacity
                onPress={() => {
                  haptics.light();
                  openRetentionModal();
                }}
                activeOpacity={0.7}
                style={{ marginTop: Spacing.md }}
              >
                <Card variant="elevated" padding="md" style={styles.prefCard}>
                  <View style={styles.prefRow}>
                    <View style={styles.prefTextBlock}>
                      <Text style={styles.prefTitle}>Notification Retention</Text>
                      <Text style={styles.prefSubtitle}>
                        Auto-delete logged notifications after a set period. {nextCleanupText}
                      </Text>
                    </View>
                    <View style={styles.retentionValueContainer}>
                      <Text style={styles.retentionValue}>{getRetentionLabel(retentionDays)}</Text>
                      <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Security</Text>
              <Card variant="elevated" padding="none" style={styles.securityCard}>
                {isEmailUser && (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        haptics.light();
                        handleChangePassword();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItem}>
                        <View style={styles.menuItemIcon}>
                          <MaterialIcons name="lock" size={22} color={COLORS.primary} />
                        </View>
                        <View style={styles.menuItemContent}>
                          <Text style={styles.menuItemTitle}>Change Password</Text>
                          <Text style={styles.menuItemSubtitle}>Update your account password</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
                      </View>
                    </TouchableOpacity>
                    <View style={styles.itemDivider} />
                  </>
                )}
                <TouchableOpacity
                  onPress={() => {
                    haptics.light();
                    openDeleteModal();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItem}>
                    <View
                      style={[styles.menuItemIcon, { backgroundColor: 'rgba(193, 140, 93, 0.08)' }]}
                    >
                      <MaterialIcons name="delete-forever" size={22} color={COLORS.error} />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={[styles.menuItemTitle, { color: COLORS.error }]}>
                        Delete Account
                      </Text>
                      <Text style={styles.menuItemSubtitle}>Permanently remove your account</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={COLORS.text.muted} />
                  </View>
                </TouchableOpacity>
              </Card>
            </View>
          </>
        )}
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalBody}>
              This is permanent. Your account cannot be recovered once deleted.
            </Text>

            {isEmailUser ? (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmLabel}>
                  Type <Text style={styles.confirmHighlight}>DELETE</Text> to confirm:
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={confirmationText}
                  onChangeText={setConfirmationText}
                  placeholder="DELETE"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Text style={styles.confirmLabel}>Password:</Text>
                <TextInput
                  style={styles.modalInput}
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  placeholder="Password"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
            ) : (
              <Text style={styles.modalTextExtra}>
                You will be asked to sign in with Google to confirm.
              </Text>
            )}

            <View style={styles.modalButtons}>
              <Button
                label="Cancel"
                onPress={closeDeleteModal}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                label={isDeleting ? 'Deleting...' : 'Delete'}
                onPress={handleDeleteAccount}
                variant="danger"
                size="md"
                disabled={isDeleting || (isEmailUser && confirmationText !== 'DELETE')}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* Retention Period Modal */}
      <Modal
        visible={retentionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRetentionModal}
      >
        <View style={styles.modalOverlay}>
          <Card variant="elevated" padding="lg" style={styles.retentionModalContent}>
            <Text style={styles.modalTitle}>Notification Retention</Text>
            <Text style={styles.modalBody}>
              Choose how long to keep logged notifications before they are automatically deleted.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {RETENTION_OPTIONS.map((option) => {
                const isSelected = selectedRetentionOption === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.retentionOption, isSelected && styles.retentionOptionSelected]}
                    onPress={() => {
                      haptics.light();
                      setSelectedRetentionOption(option.value);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.retentionOptionRadio,
                        isSelected && styles.retentionOptionRadioSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.retentionOptionRadioInner} />}
                    </View>
                    <Text
                      style={[
                        styles.retentionOptionText,
                        isSelected && styles.retentionOptionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.retentionModalFooter}>
              <Text style={styles.retentionPreviewText}>
                Next cleanup would be:{' '}
                {(() => {
                  const lastCleanup = new Date();
                  return formatNextCleanupRelative(selectedRetentionOption, lastCleanup);
                })()}
              </Text>

              <View style={styles.modalButtons}>
                <Button
                  label="Cancel"
                  onPress={closeRetentionModal}
                  variant="secondary"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Save"
                  onPress={handleSaveRetention}
                  variant="primary"
                  size="md"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Card>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 60,
  },
  scrollContent: {
    paddingBottom: Spacing.jumbo,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  sectionHeader: {
    fontSize: 18,
    color: COLORS.primary,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  sectionIntro: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: Spacing.lg,
    lineHeight: 21,
    fontFamily: 'Nunito_400Regular',
    marginLeft: Spacing.xs,
  },
  accountCard: {
    ...Shadows.sm,
  },
  accountHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    borderWidth: 2,
    borderColor: COLORS.surface.border,
  },
  avatarInitial: {
    color: COLORS.primary,
    fontSize: 24,
    fontFamily: 'Fraunces_700Bold',
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  accountLabel: {
    fontSize: 12,
    color: COLORS.text.muted,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontFamily: 'Nunito_600SemiBold',
  },
  accountDisplayName: {
    fontSize: 18,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
  },
  accountMeta: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: Spacing.xs,
    fontFamily: 'Nunito_400Regular',
  },
  accountMetaSmall: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: Spacing.sm,
    fontFamily: 'Nunito_400Regular',
  },
  editHintPress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface.border,
    gap: Spacing.sm,
  },
  editHintPressed: {
    opacity: 0.7,
  },
  accountHint: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.primary,
  },
  editNameContainer: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface.border,
  },
  inputLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
    marginBottom: Spacing.md,
  },
  editNameButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(193, 140, 93, 0.08)',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  verifyBannerText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
  },
  prefCard: {
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  prefTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  toggleContainer: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleLoader: {
    width: 28,
    height: 28,
  },
  prefTitle: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  prefSubtitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    marginTop: Spacing.xs,
    lineHeight: 18,
    fontFamily: 'Nunito_400Regular',
  },
  platformHint: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 21,
    marginBottom: Spacing.lg,
    fontFamily: 'Nunito_400Regular',
  },
  securityCard: {
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(93, 112, 82, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_600SemiBold',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.accent,
    marginLeft: 56,
    opacity: 0.3,
  },
  unauthCard: {
    ...Shadows.sm,
  },
  unauthTitle: {
    fontSize: 22,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  unauthSubtitle: {
    fontSize: 15,
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    fontFamily: 'Nunito_400Regular',
  },
  primaryAuthButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryPressed: {
    opacity: 0.88,
  },
  primaryAuthButtonText: {
    color: COLORS.primaryForeground,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  secondaryAuthButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryPressed: {
    opacity: 0.7,
  },
  secondaryAuthButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  modalTitle: {
    fontSize: 22,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 15,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  confirmBox: {
    marginBottom: Spacing.xl,
  },
  confirmLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: Spacing.sm,
  },
  confirmHighlight: {
    color: COLORS.error,
    fontWeight: 'bold',
  },
  modalInput: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: COLORS.foreground,
    marginBottom: Spacing.md,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  modalTextExtra: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  retentionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  retentionValue: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
  },
  retentionModalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Shadows.xl,
  },
  retentionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  retentionOptionSelected: {
    backgroundColor: 'rgba(93, 112, 82, 0.12)',
  },
  retentionOptionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.text.muted,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retentionOptionRadioSelected: {
    borderColor: COLORS.primary,
  },
  retentionOptionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  retentionOptionText: {
    fontSize: 16,
    color: COLORS.foreground,
    fontFamily: 'Nunito_400Regular',
  },
  retentionOptionTextSelected: {
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.primary,
  },
  retentionModalFooter: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.surface.border,
  },
  retentionPreviewText: {
    fontSize: 13,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
});
