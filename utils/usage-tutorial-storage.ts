import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import { StorageManager } from '@/utils/storage/storage-manager';

const TUTORIAL_KEY = STORAGE_KEYS.USAGE_TUTORIAL;

type UsageTutorialStatus = 'pending' | 'seen';

interface UsageTutorialState {
  status: UsageTutorialStatus;
}

async function getState(): Promise<UsageTutorialState | null> {
  try {
    return await StorageManager.getItem<UsageTutorialState>(TUTORIAL_KEY);
  } catch {
    return null;
  }
}

/** True when this install finished setup and has not finished the usage tour. */
export async function isUsageTutorialPending(): Promise<boolean> {
  const state = await getState();
  return state?.status === 'pending';
}

/**
 * Show the usage tour the next time the main app opens.
 * Called when a user finishes setup — not when an existing install is migrated.
 */
export async function queueUsageTutorial(): Promise<void> {
  const state: UsageTutorialState = { status: 'pending' };
  await StorageManager.setItem(TUTORIAL_KEY, state);
}

export async function markUsageTutorialSeen(): Promise<void> {
  const state: UsageTutorialState = { status: 'seen' };
  await StorageManager.setItem(TUTORIAL_KEY, state);
}

export async function clearUsageTutorial(): Promise<void> {
  await StorageManager.removeItem(TUTORIAL_KEY);
}

/**
 * Persist setup completion and queue the usage tour.
 * Use this from the end of the setup flow. Migration must keep calling
 * `markOnboardingComplete` so people who already use the app are not toured.
 */
export async function completeOnboardingAndQueueTutorial(): Promise<void> {
  const { markOnboardingComplete } = await import('@/utils/onboarding-storage');
  await markOnboardingComplete();
  await queueUsageTutorial();
}

/**
 * People who already finished setup before the usage tour existed should not
 * see it automatically. Runs once at startup, before any screen can finish
 * setup in the same launch.
 */
export async function grandfatherUsageTutorial(): Promise<void> {
  const existing = await getState();
  if (existing) return;

  const { hasCompletedOnboarding } = await import('@/utils/onboarding-storage');
  if (await hasCompletedOnboarding()) {
    await markUsageTutorialSeen();
  }
}
