/**
 * NotificationLogView
 *
 * A modern grouped notification feed that fits the app's Organic/Natural
 * design system. Replaces the previous notebook metaphor with clean
 * M3-informed list rows on the app's cream surface.
 */
import React, { useMemo, useState } from 'react';

import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import { COLORS, Radius, Shadows, Spacing, TouchTargets } from '@/constants/theme';
import { haptics } from '@/services/haptics';

// ── Types ────────────────────────────────────────────────────────────────────

export interface NotebookLogEntry {
  id: number;
  appName: string;
  title: string;
  text: string;
  postTime: number;
  packageName: string;
  category?: string;
  timestamp?: number;
  autoReplied?: boolean;
}

interface NotebookLogViewProps {
  notifications: NotebookLogEntry[];
  onRefresh?: () => void;
  isActive?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Derive a stable muted tint from an app name for its avatar circle */
function appTint(appName: string): string {
  const tints = [
    `${COLORS.primary}22`, // moss green
    `${COLORS.secondary}22`, // clay
    `${COLORS.info}22`, // same as primary — intentional
    'rgba(93,112,82,0.13)',
    'rgba(193,140,93,0.13)',
  ];
  let hash = 0;
  for (let i = 0; i < appName.length; i++) {
    hash = (hash * 31 + appName.charCodeAt(i)) & 0xffff;
  }
  return tints[hash % tints.length];
}

function appInitials(appName: string): string {
  return appName
    .split(/[\s._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotebookLogView({
  notifications,
  onRefresh,
  isActive,
}: NotebookLogViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Build sorted unique app-name filter list
  const filterOptions = useMemo(() => {
    const apps = Array.from(new Set(notifications.map((n) => n.appName))).sort();
    return ['All', ...apps];
  }, [notifications]);

  // Filter notifications
  const filtered = useMemo(
    () =>
      selectedFilter === 'All'
        ? notifications
        : notifications.filter((n) => n.appName === selectedFilter),
    [notifications, selectedFilter],
  );

  // Group by app for the feed
  const groups = useMemo(() => {
    const map: Record<string, NotebookLogEntry[]> = {};
    for (const n of filtered) {
      if (!map[n.appName]) map[n.appName] = [];
      map[n.appName].push(n);
    }
    // Sort groups by most recent notification
    return Object.entries(map).sort(
      ([, a], [, b]) =>
        Math.max(...b.map((n) => n.postTime)) - Math.max(...a.map((n) => n.postTime)),
    );
  }, [filtered]);

  return (
    <View style={styles.root}>
      {/* ── Filter chip row ── */}
      {filterOptions.length > 1 && (
        <View style={styles.filterBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterBarContent}
          >
            {filterOptions.map((opt) => {
              const active = selectedFilter === opt;
              return (
                <Pressable
                  key={opt}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => {
                    haptics.light();
                    setSelectedFilter(opt);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={opt === 'All' ? 'Show all notifications' : `Filter by ${opt}`}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Feed ── */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Empty state */}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons
                name={isActive ? 'hearing' : 'notifications-none'}
                size={36}
                color={COLORS.text.muted}
              />
            </View>
            <Text style={styles.emptyTitle}>{isActive ? 'Listening…' : 'Nothing here yet'}</Text>
            <Text style={styles.emptyBody}>
              {isActive
                ? 'Notifications will appear here as they arrive.'
                : 'Activate Landline Mode to start capturing notifications.'}
            </Text>
          </View>
        )}

        {/* Notification count summary */}
        {filtered.length > 0 && (
          <Text style={styles.countLabel}>
            {filtered.length} {filtered.length === 1 ? 'notification' : 'notifications'}
            {selectedFilter !== 'All' ? ` · ${selectedFilter}` : ''}
          </Text>
        )}

        {/* App groups */}
        {groups.map(([appName, entries]) => (
          <View key={appName} style={styles.group}>
            {/* Group header */}
            <View style={styles.groupHeader}>
              <View style={[styles.appAvatar, { backgroundColor: appTint(appName) }]}>
                <Text style={styles.appAvatarText}>{appInitials(appName)}</Text>
              </View>
              <Text style={styles.groupAppName} numberOfLines={1}>
                {appName}
              </Text>
              <View style={styles.groupCount}>
                <Text style={styles.groupCountText}>{entries.length}</Text>
              </View>
            </View>

            {/* Entries card */}
            <View style={styles.entriesCard}>
              {entries.map((notif, idx) => {
                const isExpanded = expandedIds.has(notif.id);
                const isLast = idx === entries.length - 1;
                return (
                  <Pressable
                    key={`${notif.id}-${notif.postTime}`}
                    style={({ pressed }) => [
                      styles.entry,
                      !isLast && styles.entryBorder,
                      pressed && styles.entryPressed,
                    ]}
                    onPress={() => {
                      haptics.soft();
                      toggleExpand(notif.id);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={notif.title}
                    accessibilityHint="Tap to expand or collapse"
                  >
                    {/* M3 two-line list: headline + supporting text */}
                    <View style={styles.entryMain}>
                      {/* Headline row */}
                      <View style={styles.entryHeadlineRow}>
                        <Text style={styles.entryTitle} numberOfLines={isExpanded ? undefined : 1}>
                          {notif.title}
                        </Text>
                        <Text style={styles.entryRelTime}>
                          {formatRelativeTime(notif.postTime)}
                        </Text>
                      </View>

                      {/* Supporting text */}
                      {!!notif.text && (
                        <Text style={styles.entryBody} numberOfLines={isExpanded ? undefined : 2}>
                          {notif.text}
                        </Text>
                      )}

                      {/* Expanded: full timestamp + auto-reply badge */}
                      {isExpanded && (
                        <View style={styles.entryMeta}>
                          <Text style={styles.entryTimestamp}>
                            {formatTimestamp(notif.postTime)}
                          </Text>
                          {notif.autoReplied && (
                            <View style={styles.autoRepliedBadge}>
                              <MaterialIcons name="reply" size={11} color={COLORS.primary} />
                              <Text style={styles.autoRepliedBadgeText}>Auto Replied</Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Collapsed: small auto-reply pill */}
                      {!isExpanded && notif.autoReplied && (
                        <View style={styles.autoRepliedPill}>
                          <MaterialIcons name="reply" size={10} color={COLORS.primary} />
                          <Text style={styles.autoRepliedPillText}>Auto Replied</Text>
                        </View>
                      )}
                    </View>

                    {/* Expand/collapse chevron */}
                    <MaterialIcons
                      name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={18}
                      color={COLORS.text.muted}
                      style={styles.chevron}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Bottom breathing room */}
        <View style={styles.feedFooter} />
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── Filter chip bar ──────────────────────────────────────────────────────
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  filterBarContent: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    color: COLORS.text.secondary,
  },
  filterChipTextActive: {
    color: COLORS.text.onPrimary,
  },

  // ── Feed ──────────────────────────────────────────────────────────────────
  feed: {
    flex: 1,
  },
  feedContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  feedFooter: {
    height: Spacing.jumbo,
  },

  // ── Count label ───────────────────────────────────────────────────────────
  countLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.text.muted,
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: Spacing.jumbo,
    gap: Spacing.sm,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: COLORS.surface.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  emptyTitle: {
    fontFamily: 'Fraunces_700Bold',
    fontSize: 20,
    color: COLORS.text.secondary,
  },
  emptyBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text.muted,
    textAlign: 'center',
    maxWidth: 260,
  },

  // ── App group ─────────────────────────────────────────────────────────────
  group: {
    marginBottom: Spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  // Leading avatar (M3 list leading avatar pattern)
  appAvatar: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appAvatarText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  groupAppName: {
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    letterSpacing: 0.2,
    color: COLORS.text.secondary,
  },
  groupCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: `${COLORS.primary}18`,
  },
  groupCountText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
    color: COLORS.primary,
  },

  // ── Entries card ─────────────────────────────────────────────────────────
  entriesCard: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },

  // ── Entry row (M3 two-line list item) ─────────────────────────────────────
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTargets.md,
    gap: Spacing.sm,
  },
  entryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.muted,
  },
  entryPressed: {
    backgroundColor: COLORS.surface.elevated,
  },
  entryMain: {
    flex: 1,
    gap: 3,
  },
  // M3 headline text
  entryHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  entryTitle: {
    flex: 1,
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 15,
    lineHeight: 21,
    color: COLORS.text.primary,
  },
  entryRelTime: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    lineHeight: 18,
    color: COLORS.text.muted,
    flexShrink: 0,
    paddingTop: 2,
  },
  // M3 supporting text
  entryBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  // Full timestamp shown on expand
  entryTimestamp: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: Spacing.xs,
  },
  // Meta row: timestamp + badges (shown when expanded)
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  // Auto-replied badge (shown in expanded state)
  autoRepliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${COLORS.primary}14`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
  },
  autoRepliedBadgeText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  // Auto-replied pill (shown in collapsed state, below body text)
  autoRepliedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: 3,
  },
  autoRepliedPillText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.1,
  },
  // M3 trailing icon
  chevron: {
    marginTop: 2,
    flexShrink: 0,
  },
});
