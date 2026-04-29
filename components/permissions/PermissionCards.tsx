import React from 'react';

import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { COLORS, Fonts, Radius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Permission } from './usePermissions';

const D_SURFACE = '#4a4a4a';
const D_BORDER = '#3a3a3a';
const D_TEXT_SOFT = '#E0E0E0';
const D_FG = '#FFFFFF';

interface PermissionCardsProps {
  permissions: Permission[];
  isLoading: boolean;
  onRequestPermission: (permission: Permission) => Promise<void>;
}

export function PermissionCards({
  permissions,
  isLoading,
  onRequestPermission,
}: PermissionCardsProps) {
  const { isDark } = useAppTheme();

  const handleRequestPermission = async (permission: Permission) => {
    try {
      await onRequestPermission(permission);
    } catch {
      Alert.alert(
        'Error',
        `Could not request ${permission.name}. Please try again or grant it manually in settings.`,
        [
          { text: 'OK' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ],
      );
    }
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, isDark && { color: D_TEXT_SOFT }]}>Checking permissions...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {permissions.map((permission) => {
            const isGranted = permission.status === 'granted';
            const nameStyle = [
              styles.permissionName,
              isDark && { color: D_FG },
            ];
            const descStyle = [
              styles.permissionDescription,
              isDark && { color: D_TEXT_SOFT },
            ];
            return (
              <View
                key={permission.id}
                style={[
                  styles.permissionCard,
                  !isDark && isGranted && styles.permissionCardGranted,
                  isDark && {
                    backgroundColor: isGranted ? 'rgba(93, 112, 82, 0.22)' : D_SURFACE,
                    borderColor: isGranted ? 'rgba(93, 112, 82, 0.45)' : D_BORDER,
                    shadowColor: 'transparent',
                    elevation: 0,
                  },
                ]}
              >
                {/* Icon + info */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconCircle, isGranted && styles.iconCircleGranted]}>
                    <MaterialIcons
                      name={isGranted ? 'check' : (permission.icon as any)}
                      size={24}
                      color={isGranted ? '#fff' : isDark ? '#B8C4A8' : COLORS.primary}
                    />
                  </View>
                  <View style={styles.permissionInfo}>
                    <View style={styles.nameRow}>
                      <Text style={nameStyle}>{permission.name}</Text>
                      {permission.isRequired && !isGranted && (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredText}>Required</Text>
                        </View>
                      )}
                    </View>
                    <Text style={descStyle}>{permission.description}</Text>
                  </View>
                </View>

                {/* Why needed + grant button */}
                {!isGranted && (
                  <>
                    <Text style={[styles.whyNeeded, isDark && { color: D_TEXT_SOFT }]}>
                      {permission.whyNeeded}
                    </Text>
                    <Pressable
                      onPress={() => handleRequestPermission(permission)}
                      style={({ pressed }) => [
                        styles.grantButton,
                        isDark && { borderColor: '#FFF' },
                        pressed && { transform: [{ scale: 0.97 }], opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[styles.grantButtonText, isDark && { color: '#FFF' as const }]}
                      >
                        Grant Access
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            );
          })}

          {/* Info note */}
          <View style={styles.infoNote}>
            <MaterialIcons
              name="info-outline"
              size={20}
              color={isDark ? '#B8C4A8' : COLORS.primary}
            />
            <Text style={[styles.infoText, isDark && { color: D_TEXT_SOFT }]}>
              You can change these anytime in your device settings.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    color: COLORS.mutedForeground,
  },
  permissionCard: {
    backgroundColor: COLORS.surface.card,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: 'rgba(222, 216, 207, 0.5)',
    padding: 20,
    marginBottom: 16,
    ...Shadows.sm,
  },
  permissionCardGranted: {
    borderWidth: 1,
    borderColor: 'rgba(93, 112, 82, 0.3)',
    backgroundColor: 'rgba(93, 112, 82, 0.04)',
    shadowColor: 'transparent',
    elevation: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'transparent',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(93, 112, 82, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleGranted: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
  },
  permissionInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  permissionName: {
    fontFamily: Fonts?.sansBold ?? 'Nunito_700Bold',
    fontSize: 16,
    color: COLORS.foreground,
  },
  requiredBadge: {
    backgroundColor: 'rgba(193, 140, 93, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  requiredText: {
    fontFamily: Fonts?.sansSemiBold ?? 'Nunito_600SemiBold',
    fontSize: 11,
    color: COLORS.secondary,
    letterSpacing: 0.3,
  },
  permissionDescription: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 14,
    color: COLORS.mutedForeground,
    lineHeight: 20,
  },
  whyNeeded: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 13,
    color: COLORS.mutedForeground,
    marginTop: 14,
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  grantButton: {
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grantButtonText: {
    fontFamily: Fonts?.sansBold ?? 'Nunito_700Bold',
    fontSize: 13,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  infoText: {
    fontFamily: Fonts?.sans ?? 'Nunito_400Regular',
    fontSize: 13,
    color: COLORS.mutedForeground,
    flex: 1,
    lineHeight: 20,
  },
});
