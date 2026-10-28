/**
 * Device-local caps for how long the user wants to stay under on specific apps.
 */
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import {
  MAX_DAILY_TARGET_MS,
  MAX_WEEKLY_TARGET_MS,
  type UsageTarget,
  type UsageTargetDraft,
  normalizeUsageTargets,
  sanitizeLimitMs,
} from '@/utils/usage-targets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface UsageTargetsState {
  targets: UsageTarget[];
  upsertTarget: (draft: UsageTargetDraft) => void;
  removeTarget: (packageName: string) => void;
}

export const useUsageTargetsStore = create<UsageTargetsState>()(
  persist(
    (set, get) => ({
      targets: [],

      upsertTarget: (draft) => {
        const packageName = draft.packageName.trim();
        if (!packageName) return;
        const dailyLimitMs = sanitizeLimitMs(draft.dailyLimitMs, MAX_DAILY_TARGET_MS);
        const weeklyLimitMs = sanitizeLimitMs(draft.weeklyLimitMs, MAX_WEEKLY_TARGET_MS);
        if (dailyLimitMs == null && weeklyLimitMs == null) return;

        const existing = get().targets.find((target) => target.packageName === packageName);
        const next: UsageTarget = {
          packageName,
          appName: draft.appName.trim() || packageName,
          dailyLimitMs,
          weeklyLimitMs,
          createdAt: existing?.createdAt ?? draft.createdAt ?? Date.now(),
        };
        const targets = existing
          ? get().targets.map((target) => (target.packageName === packageName ? next : target))
          : [next, ...get().targets];
        set({ targets });
      },

      removeTarget: (packageName) => {
        set({
          targets: get().targets.filter((target) => target.packageName !== packageName),
        });
      },
    }),
    {
      name: STORAGE_KEYS.USAGE_TARGETS,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ targets: state.targets }),
      merge: (persisted, current) => {
        const stored = persisted as { targets?: unknown } | undefined;
        return {
          ...current,
          targets: normalizeUsageTargets(stored?.targets),
        };
      },
    },
  ),
);
