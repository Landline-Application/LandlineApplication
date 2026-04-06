/**
 * use-preferences-store.ts
 *
 * Local-first, offline-safe store for user preferences that are backed up to
 * Firestore when a Firebase user (anonymous or real) is available.
 *
 * Design:
 *  - All reads are instant — state lives in memory and is persisted to
 *    AsyncStorage via Zustand's `persist` middleware. No async needed.
 *  - All writes update local state immediately, then fire-and-forget sync
 *    to Firestore in the background. `hasPendingSync` tracks whether local
 *    changes have been confirmed by Firestore.
 *  - `onAuthReady(uid)` is called by AuthContext whenever a Firebase user
 *    becomes available. It fetches remote prefs and merges them with local
 *    state using the following strategy:
 *      • hasPendingSync === true  → local wins; push local state to Firestore
 *      • hasPendingSync === false → remote wins when present; apply and mark synced
 *      • remote is null/empty    → keep local, push local state up (first install)
 */
import { auth } from '@/utils/firebase/auth';
import { getUserPreferences, mergeUserPreferences } from '@/utils/firebase/user-service';
import type { UserPreferences } from '@/utils/firebase/user-service';
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_AUTO_REPLY_ENABLED = false;
export const DEFAULT_RETENTION_DAYS = 30;

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface PreferencesState {
  // Preferences — always available, even offline / before auth
  autoReplyEnabled: boolean;
  notificationRetentionDays: number;

  // Sync metadata (not meaningful to UI beyond showing a pending badge)
  isSyncing: boolean;
  lastSyncedAt: number | null; // ms timestamp
  hasPendingSync: boolean; // true when local changes haven't been confirmed yet

  // Public setters — called by other stores and UI components
  setAutoReplyEnabled: (val: boolean) => void;
  setRetentionDays: (days: number) => void;

  // Called by AuthContext after every auth state change (anonymous or real user)
  onAuthReady: (uid: string) => Promise<void>;

  // Internal
  _syncToFirestore: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      // -----------------------------------------------------------------------
      // Initial state
      // -----------------------------------------------------------------------
      autoReplyEnabled: DEFAULT_AUTO_REPLY_ENABLED,
      notificationRetentionDays: DEFAULT_RETENTION_DAYS,
      isSyncing: false,
      lastSyncedAt: null,
      hasPendingSync: false,

      // -----------------------------------------------------------------------
      // Public setters
      // -----------------------------------------------------------------------

      setAutoReplyEnabled: (val: boolean) => {
        set({ autoReplyEnabled: val, hasPendingSync: true });
        get()._syncToFirestore();
      },

      setRetentionDays: (days: number) => {
        set({ notificationRetentionDays: days, hasPendingSync: true });
        get()._syncToFirestore();
      },

      // -----------------------------------------------------------------------
      // onAuthReady — merge remote prefs with local state
      // -----------------------------------------------------------------------

      onAuthReady: async (uid: string) => {
        const { hasPendingSync, _syncToFirestore } = get();

        try {
          const remote = await getUserPreferences(uid);

          if (hasPendingSync) {
            // Local changes made before/during auth — push them up.
            await _syncToFirestore();
            return;
          }

          if (!remote || Object.keys(remote).length === 0) {
            // No remote prefs yet (new user or first install on this account).
            // Push local defaults so the document has preferences from day one.
            await _syncToFirestore();
            return;
          }

          // Remote has values and there are no pending local changes → remote wins.
          // Applying these values will trigger any external subscribers (e.g. the
          // auto-reply store) to reconcile native state via their own subscriptions.
          const update: Partial<PreferencesState> = {};

          if (remote.autoReplyEnabled !== undefined) {
            update.autoReplyEnabled = remote.autoReplyEnabled;
          }
          if (remote.notificationRetentionDays !== undefined) {
            update.notificationRetentionDays = remote.notificationRetentionDays;
          }

          set({ ...update, hasPendingSync: false, lastSyncedAt: Date.now() });
        } catch (e) {
          // Network error — keep local state, mark pending so we retry next time.
          console.warn('usePreferencesStore.onAuthReady: failed to fetch remote prefs', e);
          set({ hasPendingSync: true });
        }
      },

      // -----------------------------------------------------------------------
      // _syncToFirestore — best-effort background write
      // -----------------------------------------------------------------------

      _syncToFirestore: async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return; // No user yet — changes are kept in hasPendingSync

        const { autoReplyEnabled, notificationRetentionDays } = get();

        set({ isSyncing: true });
        try {
          const preferences: UserPreferences = {
            autoReplyEnabled,
            notificationRetentionDays,
          };
          await mergeUserPreferences(uid, preferences);
          set({ hasPendingSync: false, lastSyncedAt: Date.now() });
        } catch (e) {
          console.warn('usePreferencesStore._syncToFirestore: sync failed, will retry', e);
          // hasPendingSync stays true — onAuthReady will retry on next auth event
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: STORAGE_KEYS.USER_PREFERENCES,
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the user-facing preferences and sync metadata.
      // Transient flags (isSyncing) are intentionally excluded.
      partialize: (state) => ({
        autoReplyEnabled: state.autoReplyEnabled,
        notificationRetentionDays: state.notificationRetentionDays,
        lastSyncedAt: state.lastSyncedAt,
        hasPendingSync: state.hasPendingSync,
      }),
    },
  ),
);
