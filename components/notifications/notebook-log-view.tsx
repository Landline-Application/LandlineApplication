import React, { useMemo, useState } from 'react';

import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';

import { MaterialIcons } from '@/components/ui/icon-symbol';
import SwipeableRow from '@/components/ui/swipeable-row';
import { COLORS, Radius, Shadows, Spacing, TouchTargets } from '@/constants/theme';
import { haptics } from '@/services/haptics';

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
  replyText?: string;
}

interface NotebookLogViewProps {
  notifications: NotebookLogEntry[];
  onRefresh?: () => void;
  isActive?: boolean;
  onDeleteNotification?: (entry: NotebookLogEntry) => void | Promise<void>;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function appTint(appName: string): string {
  const tints = [
    `${COLORS.primary}22`,
    `${COLORS.secondary}22`,
    `${COLORS.info}22`,
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

interface EntryRowProps {
  notif: NotebookLogEntry;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  canDelete?: boolean;
  onDelete?: () => void | Promise<void>;
  swipeContainerStyle?: import('react-native').StyleProp<import('react-native').ViewStyle>;
}

function EntryRow({ notif, isLast, isExpanded, onToggleExpand, canDelete, onDelete, swipeContainerStyle }: EntryRowProps) {
  const pressable = (
    <Pressable
      style={({ pressed }) => [
        styles.entry,
        !isLast && styles.entryBorder,
        pressed && styles.entryPressed,
      ]}
      onPress={() => {
        haptics.soft();
        onToggleExpand();
      }}
      accessibilityRole="button"
      accessibilityLabel={notif.title}
      accessibilityHint={canDelete ? 'Tap to expand or collapse. Swipe left to delete.' : 'Tap to expand or collapse'}
      accessibilityActions={canDelete ? [{ name: 'delete', label: 'Delete notification' }] : undefined}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'delete') {
          void onDelete?.();
        }
      }}
    >
      <View style={styles.entryMain}>
        <View style={styles.entryHeadlineRow}>
          <Text style={styles.entryTitle} numberOfLines={isExpanded ? undefined : 1}>
            {notif.title}
          </Text>
          <Text style={styles.entryRelTime}>{formatRelativeTime(notif.postTime)}</Text>
        </View>

        {!!notif.text && (
          <Text style={styles.entryBody} numberOfLines={isExpanded ? undefined : 2}>
            {notif.text}
          </Text>
        )}

        {isExpanded && (
          <View style={styles.entryMeta}>
            <Text style={styles.entryTimestamp}>{formatTimestamp(notif.postTime)}</Text>
            {notif.autoReplied && (
              <View style={styles.autoRepliedBadge}>
                <MaterialIcons name="reply" size={11} color={COLORS.primary} />
                <Text style={styles.autoRepliedBadgeText}>Auto Replied</Text>
              </View>
            )}
          </View>
        )}

        {isExpanded && notif.autoReplied && !!notif.replyText && (
          <View style={styles.replySubRow}>
            <View style={styles.replySubRowLine} />
            <View style={styles.replySubRowContent}>
              <Text style={styles.replySubRowLabel}>Replied</Text>
              <Text style={styles.replySubRowText}>{notif.replyText}</Text>
            </View>
          </View>
        )}

        {!isExpanded && notif.autoReplied && (
          <View style={styles.autoRepliedPill}>
            <MaterialIcons name="reply" size={10} color={COLORS.primary} />
            <Text style={styles.autoRepliedPillText}>Auto Replied</Text>
          </View>
        )}
      </View>

      <MaterialIcons
        name={isExpanded ? 'expand-less' : 'expand-more'}
        size={18}
        color={COLORS.text.muted}
        style={styles.chevron}
      />
    </Pressable>
  );

  if (!canDelete || !onDelete) return pressable;

  return (
    <SwipeableRow
      onSwipeLeft={{
        render: () => <MaterialIcons name="delete-outline" size={22} color={COLORS.background} />,
        onAction: onDelete,
      }}
      containerStyle={swipeContainerStyle}
    >
      {pressable}
    </SwipeableRow>
  );
}

export default function NotebookLogView({
  notifications,
  onRefresh,
  isActive,
  onDeleteNotification,
}: NotebookLogViewProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const filterOptions = useMemo(() => {
    const apps = Array.from(new Set(notifications.map((n) => n.appName))).sort();
    return ['All', ...apps];
  }, [notifications]);

  const filtered = useMemo(
    () =>
      selectedFilter === 'All'
        ? notifications
        : notifications.filter((n) => n.appName === selectedFilter),
    [notifications, selectedFilter],
  );

  const groups = useMemo(() => {
    const map: Record<string, NotebookLogEntry[]> = {};
    for (const n of filtered) {
      if (!map[n.appName]) map[n.appName] = [];
      map[n.appName].push(n);
    }
    return Object.entries(map).sort(
      ([, a], [, b]) =>
        Math.max(...b.map((n) => n.postTime)) - Math.max(...a.map((n) => n.postTime)),
    );
  }, [filtered]);

  return (
    <View style={styles.root}>
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

      <GestureScrollView
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

        {filtered.length > 0 && (
          <Text style={styles.countLabel}>
            {filtered.length} {filtered.length === 1 ? 'notification' : 'notifications'}
            {selectedFilter !== 'All' ? ` · ${selectedFilter}` : ''}
          </Text>
        )}

        {groups.map(([appName, entries]) => (
          <View key={appName} style={styles.group}>
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

            <View style={styles.entriesCard}>
              {entries.map((notif, idx) => {
                const entryKey = `${appName}-${notif.id}-${notif.postTime}-${idx}`;
                const isFirst = idx === 0;
                const isLast = idx === entries.length - 1;
                const canDelete =
                  typeof onDeleteNotification === 'function' && typeof notif.timestamp === 'number';

                const swipeContainerStyle = {
                  borderTopLeftRadius: isFirst ? Radius.lg : 0,
                  borderTopRightRadius: isFirst ? Radius.lg : 0,
                  borderBottomLeftRadius: isLast ? Radius.lg : 0,
                  borderBottomRightRadius: isLast ? Radius.lg : 0,
                };

                return (
                  <EntryRow
                    key={entryKey}
                    notif={notif}
                    isLast={isLast}
                    isExpanded={expandedKeys.has(entryKey)}
                    onToggleExpand={() => toggleExpand(entryKey)}
                    canDelete={canDelete}
                    onDelete={canDelete ? () => onDeleteNotification(notif) : undefined}
                    swipeContainerStyle={swipeContainerStyle}
                  />
                );
              })}
            </View>
          </View>
        ))}

        <View style={styles.feedFooter} />
      </GestureScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
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
  countLabel: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 12,
    color: COLORS.text.muted,
    letterSpacing: 0.3,
    marginBottom: Spacing.md,
  },
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
  entriesCard: {
    backgroundColor: COLORS.surface.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTargets.md,
    gap: Spacing.sm,
    backgroundColor: COLORS.surface.base,
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
  entryBody: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  entryTimestamp: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 11,
    color: COLORS.text.muted,
    marginTop: Spacing.xs,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
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
  chevron: {
    marginTop: 2,
    flexShrink: 0,
  },
  replySubRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    marginLeft: Spacing.md,
    gap: Spacing.sm,
  },
  replySubRowLine: {
    width: 2,
    borderRadius: 1,
    backgroundColor: `${COLORS.primary}40`,
    alignSelf: 'stretch',
  },
  replySubRowContent: {
    flex: 1,
    paddingLeft: Spacing.xs,
  },
  replySubRowLabel: {
    fontSize: 10,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  replySubRowText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: COLORS.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
