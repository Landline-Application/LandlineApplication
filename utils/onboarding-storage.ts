import { StorageManager } from '@/utils/storage/storage-manager';

const ONBOARDING_KEY = '@landline_onboarding_complete';

interface OnboardingState {
  completed: boolean;
  completedAt: string;
  version: string;
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const state = await StorageManager.getItem<OnboardingState>(ONBOARDING_KEY);
    if (!state) return false;
    return state.completed === true;
  } catch {
    return false;
  }
}

export async function markOnboardingComplete(): Promise<void> {
  const state: OnboardingState = {
    completed: true,
    completedAt: new Date().toISOString(),
    version: '1.0.0',
  };
  await StorageManager.setItem(ONBOARDING_KEY, state);
}

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
