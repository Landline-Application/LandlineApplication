import React from 'react';

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { haptics } from '@/services/haptics';
import { router } from 'expo-router';

const D_BG = '#5f5f5f';
const D_BORDER = '#3a3a3a';
const D_FG = '#FFFFFF';

interface SettingsPageHeaderProps {
  title: string;
  /** Safe-area top inset — applied as paddingTop on the header. */
  paddingTop: number;
  onBack?: () => void;
}

/**
 * Shared chrome for Preferences sub-screens (matches Emergency Contacts).
 * Icon-only back + centered Fraunces title.
 */
export function SettingsPageHeader({ title, paddingTop, onBack }: SettingsPageHeaderProps) {
  const { isDark } = useAppTheme();

  const handleBack = () => {
    haptics.light();
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.header,
        { paddingTop },
        isDark && { backgroundColor: D_BG, borderBottomColor: D_BORDER },
      ]}
    >
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={24} color={isDark ? D_FG : COLORS.foreground} />
      </TouchableOpacity>
      <View style={styles.headerText}>
        <Text style={[styles.headerTitle, isDark && { color: D_FG }]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

interface SettingsDescriptionCardProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
}

/** Tinted intro card used at the top of Preferences sub-screens. */
export function SettingsDescriptionCard({ icon, title, body }: SettingsDescriptionCardProps) {
  const { isDark } = useAppTheme();
  const accent = isDark ? '#B8C4A8' : COLORS.primary;

  return (
    <View
      style={[
        styles.descriptionCard,
        isDark && {
          backgroundColor: 'rgba(93, 112, 82, 0.18)',
          borderColor: 'rgba(184, 196, 168, 0.35)',
        },
      ]}
    >
      <MaterialIcons name={icon} size={20} color={accent} />
      <View style={styles.descriptionTextContainer}>
        <Text style={[styles.descriptionTitle, isDark && { color: '#FFFFFF' }]}>{title}</Text>
        <Text style={[styles.descriptionText, isDark && { color: '#E0E0E0' }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_700Bold',
  },
  headerSpacer: {
    width: 40,
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}20`,
    padding: Spacing.lg,
  },
  descriptionTextContainer: {
    flex: 1,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.foreground,
    fontFamily: 'Nunito_700Bold',
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
  },
});
