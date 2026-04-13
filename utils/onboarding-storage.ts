import { StorageManager } from '@/utils/storage/storage-manager';
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';

const ONBOARDING_KEY = STORAGE_KEYS.ONBOARDING_COMPLETE;

/** Bump when onboarding steps change so you can optionally re-show (future use). */
const ONBOARDING_VERSION = '1.0.0';

interface OnboardingState {
  completed: boolean;
  completedAt: string;
  version: string;
}

/**
 * Whether this install has finished the onboarding flow (AsyncStorage on device).
 * - Reinstall / clear data: returns false until completed again.
 * - Logout: unchanged — completion is device-scoped, not tied to Firebase session.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const state = await StorageManager.getItem<OnboardingState>(ONBOARDING_KEY);
    if (!state) return false;
    return state.completed === true;
  } catch {
    return false;
  }
}

/**
 * Persist onboarding completion. Call when the user reaches the main app after the
 * full flow (e.g. permissions granted) or after an explicit “skip” / alternate
 * entry that should count as done (sign-in success, phone verification, etc.).
 */
export async function markOnboardingComplete(): Promise<void> {
  const state: OnboardingState = {
    completed: true,
    completedAt: new Date().toISOString(),
    version: ONBOARDING_VERSION,
  };
  await StorageManager.setItem(ONBOARDING_KEY, state);
}

/** Clear completion so the user sees onboarding again (e.g. Settings reset). */
export async function resetOnboarding(): Promise<void> {
  await StorageManager.removeItem(ONBOARDING_KEY);
}

/**
 * Migration: if user has old acceptance flag, mark onboarding as complete
 * This ensures existing users don't get re-onboarded after the update
 */
export async function migrateFromOldAcceptance(): Promise<void> {
  try {
    const { hasAcceptedTerms, clearAcceptance } = await import('@/utils/acceptance-storage');
    const accepted = await hasAcceptedTerms();
    if (accepted) {
      if (!(await hasCompletedOnboarding())) {
        await markOnboardingComplete();
      }
      // Always clear old data once we've processed it (either here or previously)
      // to avoid migration logic running on every startup after a manual reset
      await clearAcceptance();
    }
  } catch {
    // acceptance-storage may not exist or fail to import; silently ignore
  }
}
