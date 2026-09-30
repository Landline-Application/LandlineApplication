import React from 'react';

import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import {
  SettingsDescriptionCard,
  SettingsPageHeader,
} from '@/components/settings/settings-page-header';
import { COLORS, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const D_BG = '#5f5f5f';
const D_SURFACE = '#4a4a4a';
const D_BORDER = '#3a3a3a';
const D_FG = '#FFFFFF';
const D_SOFT = '#E0E0E0';
const D_ACCENT = '#B8C4A8';

export default function DesignScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, setDarkMode } = useAppTheme();

  return (
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <SettingsPageHeader title="Design" paddingTop={insets.top} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <SettingsDescriptionCard
            icon="palette"
            title="Design"
            body="Choose how Landline looks. Dark mode softens the screen for low-light use without changing how the app works."
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, isDark && { color: D_ACCENT }]}>Theme</Text>
          <View
            style={[
              styles.card,
              isDark && {
                backgroundColor: D_SURFACE,
                borderColor: D_BORDER,
                shadowColor: 'transparent',
                elevation: 0,
              },
            ]}
          >
            <View style={styles.prefRow}>
              <View style={styles.prefTextBlock}>
                <Text style={[styles.prefTitle, isDark && { color: D_FG }]}>Dark mode</Text>
                <Text style={[styles.prefSubtitle, isDark && { color: D_SOFT }]}>
                  Use a darker app appearance for low-light environments.
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={(nextValue) => {
                  setDarkMode(nextValue);
                  haptics.light();
                }}
                trackColor={{ false: COLORS.accent, true: COLORS.primary }}
                thumbColor={COLORS.surface.base}
                accessibilityLabel="Toggle dark mode"
              />
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.jumbo }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionLabel: {
    fontSize: 13,
    color: COLORS.primary,
    fontFamily: 'Nunito_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  prefTextBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: Spacing.sm,
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
});
