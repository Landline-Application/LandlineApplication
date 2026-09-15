/**
 * use-achievements-store.ts
 *
 * Local-only achievement unlocks earned from Landline Mode sessions.
 * Awards on session end only — never from opening the app or browsing the Log.
 */
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const TIME_AWAY_BRONZE_THRESHOLD_MS = 1 * HOUR_MS;
export const TIME_AWAY_SILVER_THRESHOLD_MS = 2 * HOUR_MS;
export const TIME_AWAY_GOLD_THRESHOLD_MS = 5 * HOUR_MS;

/** Minimum session length for a calendar day to count toward Daily Streak. */
export const STREAK_QUALIFYING_SESSION_MS = 1 * MINUTE_MS;

export const DAILY_STREAK_BRONZE_DAYS = 7;
export const DAILY_STREAK_SILVER_DAYS = 14;
export const DAILY_STREAK_GOLD_DAYS = 30;

export const NOTIFICATIONS_BLOCKED_BRONZE = 1000;
export const NOTIFICATIONS_BLOCKED_SILVER = 2000;
export const NOTIFICATIONS_BLOCKED_GOLD = 5000;

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

export const TIME_AWAY_BRONZE_ID = 'time_away_bronze' as const;
export const TIME_AWAY_SILVER_ID = 'time_away_silver' as const;
export const TIME_AWAY_GOLD_ID = 'time_away_gold' as const;
export const TIME_AWAY_FAMILY_ID = 'time_away' as const;

export const DAILY_STREAK_BRONZE_ID = 'daily_streak_bronze' as const;
export const DAILY_STREAK_SILVER_ID = 'daily_streak_silver' as const;
export const DAILY_STREAK_GOLD_ID = 'daily_streak_gold' as const;
export const DAILY_STREAK_FAMILY_ID = 'daily_streak' as const;

export const NOTIFICATIONS_BLOCKED_BRONZE_ID = 'notifications_blocked_bronze' as const;
export const NOTIFICATIONS_BLOCKED_SILVER_ID = 'notifications_blocked_silver' as const;
export const NOTIFICATIONS_BLOCKED_GOLD_ID = 'notifications_blocked_gold' as const;
export const NOTIFICATIONS_BLOCKED_FAMILY_ID = 'notifications_blocked' as const;

export type BadgeId =
  | typeof TIME_AWAY_BRONZE_ID
  | typeof TIME_AWAY_SILVER_ID
  | typeof TIME_AWAY_GOLD_ID
  | typeof DAILY_STREAK_BRONZE_ID
  | typeof DAILY_STREAK_SILVER_ID
  | typeof DAILY_STREAK_GOLD_ID
  | typeof NOTIFICATIONS_BLOCKED_BRONZE_ID
  | typeof NOTIFICATIONS_BLOCKED_SILVER_ID
  | typeof NOTIFICATIONS_BLOCKED_GOLD_ID;

export type AchievementFamilyId =
  | typeof TIME_AWAY_FAMILY_ID
  | typeof DAILY_STREAK_FAMILY_ID
  | typeof NOTIFICATIONS_BLOCKED_FAMILY_ID;

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export type BadgeUnlockRule =
  | { type: 'session_duration'; thresholdMs: number }
  | { type: 'streak_days'; thresholdDays: number }
  | { type: 'notifications_blocked'; thresholdCount: number };

export interface BadgeDefinition {
  id: BadgeId;
  title: string;
  description: string;
  tier: BadgeTier;
  unlock: BadgeUnlockRule;
}

export interface AchievementFamily {
  id: AchievementFamilyId;
  title: string;
  /** Short blurb on the family list row / detail intro. */
  summary: string;
  tiers: readonly BadgeDefinition[];
}

export interface RecordSessionEndedInput {
  durationMs: number;
  /** Notifications logged during this Landline session (postTime >= session start). */
  notificationsBlocked?: number;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

const TIME_AWAY_TIERS: readonly BadgeDefinition[] = [
  {
    id: TIME_AWAY_BRONZE_ID,
    title: 'Time Away',
    description: 'Stay in Landline Mode for 1 hour',
    tier: 'bronze',
    unlock: { type: 'session_duration', thresholdMs: TIME_AWAY_BRONZE_THRESHOLD_MS },
  },
  {
    id: TIME_AWAY_SILVER_ID,
    title: 'Time Away',
    description: 'Stay in Landline Mode for 2 hours',
    tier: 'silver',
    unlock: { type: 'session_duration', thresholdMs: TIME_AWAY_SILVER_THRESHOLD_MS },
  },
  {
    id: TIME_AWAY_GOLD_ID,
    title: 'Time Away',
    description: 'Stay in Landline Mode for 5 hours',
    tier: 'gold',
    unlock: { type: 'session_duration', thresholdMs: TIME_AWAY_GOLD_THRESHOLD_MS },
  },
] as const;

const DAILY_STREAK_TIERS: readonly BadgeDefinition[] = [
  {
    id: DAILY_STREAK_BRONZE_ID,
    title: 'Daily Streak',
    description: 'Use Landline Mode 7 days in a row',
    tier: 'bronze',
    unlock: { type: 'streak_days', thresholdDays: DAILY_STREAK_BRONZE_DAYS },
  },
  {
    id: DAILY_STREAK_SILVER_ID,
    title: 'Daily Streak',
    description: 'Use Landline Mode 14 days in a row',
    tier: 'silver',
    unlock: { type: 'streak_days', thresholdDays: DAILY_STREAK_SILVER_DAYS },
  },
  {
    id: DAILY_STREAK_GOLD_ID,
    title: 'Daily Streak',
    description: 'Use Landline Mode 30 days in a row',
    tier: 'gold',
    unlock: { type: 'streak_days', thresholdDays: DAILY_STREAK_GOLD_DAYS },
  },
] as const;

const NOTIFICATIONS_BLOCKED_TIERS: readonly BadgeDefinition[] = [
  {
    id: NOTIFICATIONS_BLOCKED_BRONZE_ID,
    title: 'Notifications Blocked',
    description: 'Block 1,000 notifications in Landline Mode',
    tier: 'bronze',
    unlock: {
      type: 'notifications_blocked',
      thresholdCount: NOTIFICATIONS_BLOCKED_BRONZE,
    },
  },
  {
    id: NOTIFICATIONS_BLOCKED_SILVER_ID,
    title: 'Notifications Blocked',
    description: 'Block 2,000 notifications in Landline Mode',
    tier: 'silver',
    unlock: {
      type: 'notifications_blocked',
      thresholdCount: NOTIFICATIONS_BLOCKED_SILVER,
    },
  },
  {
    id: NOTIFICATIONS_BLOCKED_GOLD_ID,
    title: 'Notifications Blocked',
    description: 'Block 5,000 notifications in Landline Mode',
    tier: 'gold',
    unlock: {
      type: 'notifications_blocked',
      thresholdCount: NOTIFICATIONS_BLOCKED_GOLD,
    },
  },
] as const;

export const ACHIEVEMENT_FAMILIES: readonly AchievementFamily[] = [
  {
    id: TIME_AWAY_FAMILY_ID,
    title: 'Time Away',
    summary: 'Earn tiers by staying in Landline Mode',
    tiers: TIME_AWAY_TIERS,
  },
  {
    id: DAILY_STREAK_FAMILY_ID,
    title: 'Daily Streak',
    summary: 'Earn tiers by using Landline Mode on consecutive days',
    tiers: DAILY_STREAK_TIERS,
  },
  {
    id: NOTIFICATIONS_BLOCKED_FAMILY_ID,
    title: 'Notifications Blocked',
    summary: 'Earn tiers by quieting interruptions in Landline Mode',
    tiers: NOTIFICATIONS_BLOCKED_TIERS,
  },
] as const;

/** Flat list of every tier badge (used for unlock checks). */
export const BADGE_CATALOG: readonly BadgeDefinition[] = ACHIEVEMENT_FAMILIES.flatMap(
  (family) => family.tiers,
);

const TIER_RANK: Record<BadgeTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
};

// ---------------------------------------------------------------------------
// Date / streak helpers (local calendar days)
// ---------------------------------------------------------------------------

/** Local calendar day as YYYY-MM-DD. */
export function toLocalDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addLocalDays(dayKey: string, deltaDays: number): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return toLocalDayKey(date);
}

/**
 * Live streak length. Resets to 0 if the last qualifying day was before yesterday
 * (missed a day without opening the app).
 */
export function getEffectiveCurrentStreak(
  currentStreak: number,
  lastActiveDay: string | null,
  today: string = toLocalDayKey(),
): number {
  if (!lastActiveDay || currentStreak <= 0) return 0;
  const yesterday = addLocalDays(today, -1);
  if (lastActiveDay === today || lastActiveDay === yesterday) {
    return currentStreak;
  }
  return 0;
}

export function applyQualifyingDayToStreak(params: {
  currentStreak: number;
  lastActiveDay: string | null;
  today?: string;
}): { currentStreak: number; lastActiveDay: string; streakIncreased: boolean } {
  const today = params.today ?? toLocalDayKey();
  const { lastActiveDay } = params;
  const liveStreak = getEffectiveCurrentStreak(
    params.currentStreak,
    lastActiveDay,
    today,
  );

  if (lastActiveDay === today) {
    return {
      currentStreak: liveStreak || params.currentStreak,
      lastActiveDay: today,
      streakIncreased: false,
    };
  }

  const yesterday = addLocalDays(today, -1);
  if (lastActiveDay === yesterday) {
    return {
      currentStreak: liveStreak + 1,
      lastActiveDay: today,
      streakIncreased: true,
    };
  }

  // First day ever, or gap — start a new streak
  return {
    currentStreak: 1,
    lastActiveDay: today,
    streakIncreased: true,
  };
}

export function formatBlockedCount(count: number): string {
  return count.toLocaleString();
}

// ---------------------------------------------------------------------------
// Catalog helpers
// ---------------------------------------------------------------------------

export function getAchievementFamily(
  id: string | undefined,
): AchievementFamily | undefined {
  if (!id) return undefined;
  return ACHIEVEMENT_FAMILIES.find((family) => family.id === id);
}

export function getBadgeDefinition(id: BadgeId): BadgeDefinition | undefined {
  return BADGE_CATALOG.find((b) => b.id === id);
}

export function tierLabel(tier: BadgeTier): string {
  switch (tier) {
    case 'bronze':
      return 'Bronze';
    case 'silver':
      return 'Silver';
    case 'gold':
      return 'Gold';
  }
}

export function formatBadgeTierStatus(tier: BadgeTier, unlocked: boolean): string {
  const label = tierLabel(tier);
  return unlocked ? `${label} unlocked` : `${label} · locked`;
}

/** Highest unlocked tier in a family, or null if none unlocked. */
export function getHighestUnlockedBadge(
  family: AchievementFamily,
  unlockedBadgeIds: readonly BadgeId[],
): BadgeDefinition | null {
  let best: BadgeDefinition | null = null;
  for (const badge of family.tiers) {
    if (!unlockedBadgeIds.includes(badge.id)) continue;
    if (!best || TIER_RANK[badge.tier] > TIER_RANK[best.tier]) {
      best = badge;
    }
  }
  return best;
}

export function countUnlockedInFamily(
  family: AchievementFamily,
  unlockedBadgeIds: readonly BadgeId[],
): number {
  return family.tiers.filter((badge) => unlockedBadgeIds.includes(badge.id)).length;
}

export function familyProgressLabel(
  family: AchievementFamily,
  unlockedBadgeIds: readonly BadgeId[],
): string {
  const unlocked = countUnlockedInFamily(family, unlockedBadgeIds);
  const highest = getHighestUnlockedBadge(family, unlockedBadgeIds);
  if (!highest) return 'Not started';
  if (unlocked === family.tiers.length) return `${tierLabel(highest.tier)} · complete`;
  return `${tierLabel(highest.tier)} unlocked`;
}

export function achievementsProgressLabel(
  unlockedCount: number,
  total: number,
): string {
  if (unlockedCount === 0) return 'Earn badges by time away from your phone';
  if (unlockedCount === total) return `All ${total} unlocked`;
  return `${unlockedCount} of ${total} unlocked`;
}

// ---------------------------------------------------------------------------
// Trophy Case (special / holiday / anniversary — not tiered progression)
// ---------------------------------------------------------------------------

export type TrophyKind = 'holiday' | 'anniversary' | 'special';

export type TrophyId = string;

export interface TrophyDefinition {
  id: TrophyId;
  title: string;
  description: string;
  kind: TrophyKind;
}

/**
 * Special collectible badges (holidays, anniversaries, etc.).
 * Kept separate from ACHIEVEMENT_FAMILIES — they do not use bronze/silver/gold tiers.
 * Add entries here as you introduce them; unlock logic can call unlockTrophy(id).
 */
export const TROPHY_CATALOG: readonly TrophyDefinition[] = [] as const;

export function trophyKindLabel(kind: TrophyKind): string {
  switch (kind) {
    case 'holiday':
      return 'Holiday';
    case 'anniversary':
      return 'Anniversary';
    case 'special':
      return 'Special';
  }
}

function badgesUnlockedBySessionDuration(
  durationMs: number,
  unlockedBadgeIds: readonly BadgeId[],
): BadgeId[] {
  return BADGE_CATALOG.filter(
    (badge) =>
      badge.unlock.type === 'session_duration' &&
      durationMs >= badge.unlock.thresholdMs &&
      !unlockedBadgeIds.includes(badge.id),
  ).map((badge) => badge.id);
}

function badgesUnlockedByStreak(
  streakDays: number,
  unlockedBadgeIds: readonly BadgeId[],
): BadgeId[] {
  return BADGE_CATALOG.filter(
    (badge) =>
      badge.unlock.type === 'streak_days' &&
      streakDays >= badge.unlock.thresholdDays &&
      !unlockedBadgeIds.includes(badge.id),
  ).map((badge) => badge.id);
}

function badgesUnlockedByNotificationsBlocked(
  totalBlocked: number,
  unlockedBadgeIds: readonly BadgeId[],
): BadgeId[] {
  return BADGE_CATALOG.filter(
    (badge) =>
      badge.unlock.type === 'notifications_blocked' &&
      totalBlocked >= badge.unlock.thresholdCount &&
      !unlockedBadgeIds.includes(badge.id),
  ).map((badge) => badge.id);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface AchievementsState {
  unlockedBadgeIds: BadgeId[];
  unlockedTrophyIds: TrophyId[];
  /** Consecutive qualifying days (may be stale until read via getEffectiveCurrentStreak). */
  currentStreak: number;
  longestStreak: number;
  /** Local YYYY-MM-DD of last qualifying session day. */
  lastActiveDay: string | null;
  /** Lifetime notifications logged while in Landline Mode. */
  totalNotificationsBlocked: number;
  /** Called when a Landline session successfully ends. */
  recordSessionEnded: (input: RecordSessionEndedInput) => void;
  unlockTrophy: (id: TrophyId) => void;
  isUnlocked: (id: BadgeId) => boolean;
  isTrophyUnlocked: (id: TrophyId) => boolean;
  reset: () => void;
}

export const useAchievementsStore = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlockedBadgeIds: [],
      unlockedTrophyIds: [],
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDay: null,
      totalNotificationsBlocked: 0,

      recordSessionEnded: ({ durationMs, notificationsBlocked = 0 }) => {
        const state = get();
        let unlockedBadgeIds = [...state.unlockedBadgeIds];
        let { currentStreak, longestStreak, lastActiveDay, totalNotificationsBlocked } = state;

        const timeAwayUnlocks = badgesUnlockedBySessionDuration(durationMs, unlockedBadgeIds);
        if (timeAwayUnlocks.length > 0) {
          unlockedBadgeIds = [...unlockedBadgeIds, ...timeAwayUnlocks];
        }

        if (durationMs >= STREAK_QUALIFYING_SESSION_MS) {
          const next = applyQualifyingDayToStreak({
            currentStreak,
            lastActiveDay,
          });
          currentStreak = next.currentStreak;
          lastActiveDay = next.lastActiveDay;
          longestStreak = Math.max(longestStreak, currentStreak);

          const streakUnlocks = badgesUnlockedByStreak(currentStreak, unlockedBadgeIds);
          if (streakUnlocks.length > 0) {
            unlockedBadgeIds = [...unlockedBadgeIds, ...streakUnlocks];
          }
        }

        const sessionBlocked = Math.max(0, Math.floor(notificationsBlocked));
        if (sessionBlocked > 0) {
          totalNotificationsBlocked += sessionBlocked;
          const blockedUnlocks = badgesUnlockedByNotificationsBlocked(
            totalNotificationsBlocked,
            unlockedBadgeIds,
          );
          if (blockedUnlocks.length > 0) {
            unlockedBadgeIds = [...unlockedBadgeIds, ...blockedUnlocks];
          }
        }

        set({
          unlockedBadgeIds,
          currentStreak,
          longestStreak,
          lastActiveDay,
          totalNotificationsBlocked,
        });
      },

      unlockTrophy: (id: TrophyId) => {
        const { unlockedTrophyIds } = get();
        if (unlockedTrophyIds.includes(id)) return;
        if (!TROPHY_CATALOG.some((trophy) => trophy.id === id)) return;
        set({ unlockedTrophyIds: [...unlockedTrophyIds, id] });
      },

      isUnlocked: (id: BadgeId) => get().unlockedBadgeIds.includes(id),

      isTrophyUnlocked: (id: TrophyId) => get().unlockedTrophyIds.includes(id),

      reset: () => {
        set({
          unlockedBadgeIds: [],
          unlockedTrophyIds: [],
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDay: null,
          totalNotificationsBlocked: 0,
        });
      },
    }),
    {
      name: STORAGE_KEYS.ACHIEVEMENTS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        unlockedBadgeIds: state.unlockedBadgeIds,
        unlockedTrophyIds: state.unlockedTrophyIds,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastActiveDay: state.lastActiveDay,
        totalNotificationsBlocked: state.totalNotificationsBlocked,
      }),
    },
  ),
);
