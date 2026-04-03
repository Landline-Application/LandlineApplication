import React, { useState } from 'react';

import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
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
import { haptics } from '@/services/haptics';
import { deleteAccountWithEmail } from '@/utils/firebase/auth';
import { deleteAccountWithGoogle } from '@/utils/firebase/google-auth';
import { updateUserDisplayName } from '@/utils/firebase/user-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser, signOut } = useAuth();

  // Profile state
  const [displayNameInput, setDisplayNameInput] = useState(user?.displayName?.trim() ?? '');
  const [savingDisplayName, setSavingDisplayName] = useState(false);

  // Deletion state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const isEmailUser = user?.providerData?.some((p) => p.providerId === 'password') ?? false;

  async function handleSaveDisplayName() {
    if (!user) return;
    setSavingDisplayName(true);
    try {
      await updateUserDisplayName(user, displayNameInput);
      await refreshUser();
      Alert.alert('Saved', 'Your display name was updated.');
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

  const { resetPassword } = useAuth();

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
    const isEmailUser = providers.includes('password');
    const isGoogleUser = providers.includes('google.com');

    if (isEmailUser) {
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
      if (isEmailUser) {
        await deleteAccountWithEmail(user, deletePassword);
      } else if (isGoogleUser) {
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card variant="elevated" padding="lg" style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {(user?.displayName?.trim()?.[0] ||
                  user?.email ||
                  user?.phoneNumber ||
                  '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.accountInfo}>
              {user?.displayName ? (
                <Text style={styles.accountDisplayName} numberOfLines={1}>
                  {user.displayName}
                </Text>
              ) : (
                <Text style={styles.accountDisplayNameMuted} numberOfLines={1}>
                  Anonymous User
                </Text>
              )}
              <Text style={styles.accountEmail} numberOfLines={1}>
                {user?.email || user?.phoneNumber || 'No email associated'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Display Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Profile</Text>
          <Card variant="elevated" padding="lg" style={styles.card}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.textInput}
              value={displayNameInput}
              onChangeText={setDisplayNameInput}
              placeholder="e.g. Alex M."
              placeholderTextColor={COLORS.text.muted}
              editable={!savingDisplayName}
              maxLength={80}
            />
            <Button
              label={savingDisplayName ? 'Saving...' : 'Update Name'}
              onPress={handleSaveDisplayName}
              disabled={savingDisplayName || !displayNameInput.trim()}
              size="md"
              variant="primary"
              fullWidth
            />
          </Card>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Security</Text>
          <Card variant="elevated" padding="none" style={styles.card}>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: 'Fraunces_600SemiBold',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  card: {
    ...Shadows.sm,
  },
  // Profile
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarInitial: {
    color: COLORS.primary,
    fontSize: 28,
    fontFamily: 'Fraunces_700Bold',
  },
  accountInfo: {
    flex: 1,
  },
  accountDisplayName: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
  },
  accountDisplayNameMuted: {
    fontSize: 18,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    fontStyle: 'italic',
  },
  accountEmail: {
    fontSize: 14,
    color: COLORS.text.muted,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  // Form
  inputLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_600SemiBold',
    marginBottom: Spacing.xs,
    marginLeft: 4,
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
  // Menu items
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
  // Modal
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
});
