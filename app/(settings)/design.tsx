import React from 'react';

import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DesignScreen() {
  const insets = useSafeAreaInsets();
  const { isDark, setDarkMode } = useAppTheme();
  const darkUi = isDark
    ? {
        bg: '#5f5f5f',
        border: '#3a3a3a',
        textPrimary: '#FFFFFF',
        textSecondary: '#F3F3F3',
      }
    : null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        isDark && { backgroundColor: darkUi?.bg },
      ]}
    >
      <View style={[styles.header, isDark && { backgroundColor: darkUi?.bg, borderBottomColor: darkUi?.border }]}>
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            router.back();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: darkUi?.textPrimary }]} accessibilityRole="header">
          Design
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, isDark && { color: darkUi?.textPrimary }]}>Theme</Text>
          <Card variant="elevated" padding="md" style={styles.prefCard}>
            <View style={styles.prefRow}>
              <View style={styles.prefTextBlock}>
                <Text style={[styles.prefTitle, isDark && { color: darkUi?.textPrimary }]}>Dark mode</Text>
                <Text style={[styles.prefSubtitle, isDark && { color: darkUi?.textSecondary }]}>
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
          </Card>
        </View>
      </ScrollView>
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
    marginBottom: Spacing.lg,
    marginLeft: Spacing.xs,
  },
  prefCard: {
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
