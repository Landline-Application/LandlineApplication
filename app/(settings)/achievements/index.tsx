import React, { useState } from 'react';

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { router } from 'expo-router';

import { AchievementsFamilyList } from '@/components/achievements/achievements-shelf';
import { TrophyCaseList } from '@/components/achievements/trophy-case-list';
import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import {
  BADGE_CATALOG,
  achievementsProgressLabel,
  useAchievementsStore,
} from '@/hooks/use-achievements-store';
import { haptics } from '@/services/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const D_BG = '#5f5f5f';
const D_BORDER = '#3a3a3a';

type AchievementsTab = 'achievements' | 'trophy_case';

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const [activeTab, setActiveTab] = useState<AchievementsTab>('achievements');
  const unlockedBadgeIds = useAchievementsStore((s) => s.unlockedBadgeIds);

  const headerSubtitle =
    activeTab === 'achievements'
      ? achievementsProgressLabel(unlockedBadgeIds.length, BADGE_CATALOG.length)
      : 'Your collected badges';

  const intro =
    activeTab === 'achievements'
      ? 'Track progress on everyday Landline Mode goals — Time Away, streaks, and more.'
      : 'Your collected badges in one place.';

  function selectTab(tab: AchievementsTab) {
    if (tab === activeTab) return;
    haptics.light();
    setActiveTab(tab);
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: D_BG }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top },
          isDark && { backgroundColor: D_BG, borderBottomColor: D_BORDER },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={isDark ? '#FFFFFF' : COLORS.foreground}
          />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, isDark && { color: '#FFFFFF' }]}>Achievements</Text>
          <Text style={[styles.headerSubtitle, isDark && { color: '#E0E0E0' }]}>
            {headerSubtitle}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={[styles.tabBarWrap, isDark && { borderBottomColor: D_BORDER }]}>
        <View style={[styles.tabBar, isDark && styles.tabBarDark]}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'achievements' && styles.tabActive,
              isDark && activeTab === 'achievements' && styles.tabActiveDark,
            ]}
            onPress={() => selectTab('achievements')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'achievements' }}
            accessibilityLabel="Achievements"
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'achievements' && styles.tabLabelActive,
                isDark && activeTab !== 'achievements' && { color: '#E0E0E0' },
              ]}
            >
              Achievements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'trophy_case' && styles.tabActive,
              isDark && activeTab === 'trophy_case' && styles.tabActiveDark,
            ]}
            onPress={() => selectTab('trophy_case')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'trophy_case' }}
            accessibilityLabel="Trophy Case"
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'trophy_case' && styles.tabLabelActive,
                isDark && activeTab !== 'trophy_case' && { color: '#E0E0E0' },
              ]}
            >
              Trophy Case
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.intro, isDark && { color: '#F3F3F3' }]}>{intro}</Text>
        {activeTab === 'achievements' ? (
          <AchievementsFamilyList isDark={isDark} />
        ) : (
          <TrophyCaseList isDark={isDark} />
        )}
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
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    color: COLORS.foreground,
    fontFamily: 'Fraunces_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  tabBarWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surface.border,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.muted,
    borderRadius: Radius.md,
    padding: 4,
  },
  tabBarDark: {
    backgroundColor: '#4a4a4a',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: COLORS.background,
  },
  tabActiveDark: {
    backgroundColor: '#5f5f5f',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.text.secondary,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.jumbo,
  },
  intro: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text.secondary,
    fontFamily: 'Nunito_400Regular',
    marginBottom: Spacing.xl,
  },
});
