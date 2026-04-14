import { LEGAL_DOC_VERSIONS, type LegalDocKey } from '@/constants/legal-content';
import { STORAGE_KEYS } from '@/utils/storage/storage-keys';
import { StorageManager } from '@/utils/storage/storage-manager';

const ONBOARDING_KEY = STORAGE_KEYS.ONBOARDING_COMPLETE;

/** Bump when the onboarding flow/screens change and users should redo it. */
const ONBOARDING_VERSION = 2;

type LegalVersionMap = Record<LegalDocKey, number>;

interface OnboardingState {
  completed: boolean;
  completedAt: string;
  onboardingVersion: number;
  legalVersions: LegalVersionMap;
}

/** Snapshot of the current legal versions — written on accept. */
function currentLegalVersions(): LegalVersionMap {
  return { ...LEGAL_DOC_VERSIONS };
}

async function getState(): Promise<OnboardingState | null> {
  try {
    return await StorageManager.getItem<OnboardingState>(ONBOARDING_KEY);
  } catch {
    return null;
  }
}

/**
 * Whether this install has finished the onboarding flow at the current
 * ONBOARDING_VERSION. Legal-only changes do NOT invalidate this.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const state = await getState();
  if (!state) return false;
  return state.completed === true && state.onboardingVersion === ONBOARDING_VERSION;
}

/** Legal docs whose stored accepted version is behind the current version. */
export async function changedLegalDocs(): Promise<LegalDocKey[]> {
  const state = await getState();
  const accepted = state?.legalVersions ?? ({} as Partial<LegalVersionMap>);
  return (Object.keys(LEGAL_DOC_VERSIONS) as LegalDocKey[]).filter(
    (k) => accepted[k] !== LEGAL_DOC_VERSIONS[k],
  );
}

export async function hasAcceptedCurrentLegal(): Promise<boolean> {
  return (await changedLegalDocs()).length === 0;
}

/**
 * Persist full onboarding completion at the current versions. Call when the
 * user finishes the walkthrough (permissions granted, sign-in, etc).
 */
export async function markOnboardingComplete(): Promise<void> {
  const state: OnboardingState = {
    completed: true,
    completedAt: new Date().toISOString(),
    onboardingVersion: ONBOARDING_VERSION,
    legalVersions: currentLegalVersions(),
  };
  await StorageManager.setItem(ONBOARDING_KEY, state);
}

/**
 * Persist acceptance of the current legal versions without touching the
 * onboarding-completion flag. Called from the `/legal-update` re-consent flow.
 */
export async function markLegalAccepted(): Promise<void> {
  const existing = await getState();
  const state: OnboardingState = {
    completed: existing?.completed ?? false,
    completedAt: existing?.completedAt ?? new Date().toISOString(),
    onboardingVersion: existing?.onboardingVersion ?? ONBOARDING_VERSION,
    legalVersions: currentLegalVersions(),
  };
  await StorageManager.setItem(ONBOARDING_KEY, state);
}

/** Clear completion so the user sees onboarding again (e.g. Settings reset). */
export async function resetOnboarding(): Promise<void> {
  await StorageManager.removeItem(ONBOARDING_KEY);
}

/**
 * Migration: if user has old acceptance flag, mark onboarding as complete
 * This ensures existing users don't get re-onboarded after the update.
 * Writes the current legal snapshot so the legal-update flow is not
 * triggered on this release.
 */
export async function migrateFromOldAcceptance(): Promise<void> {
  try {
    const { hasAcceptedTerms, clearAcceptance } = await import('@/utils/acceptance-storage');
    const accepted = await hasAcceptedTerms();
    if (accepted) {
      if (!(await hasCompletedOnboarding())) {
        await markOnboardingComplete();
      }
      await clearAcceptance();
    }
  } catch {
    // acceptance-storage may not exist or fail to import; silently ignore
  }
}
