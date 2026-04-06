import { Platform } from 'react-native';

import { useAutoReplyStore } from '@/hooks/use-auto-reply-store';
import { useLandlineStore } from '@/hooks/use-landline-store';
import { type UserPreferences, getUserPreferences } from '@/utils/firebase/user-service';

/**
 * Loads saved preferences from Firestore and applies them to native state.
 * Call after sign-in; remote values win when present (cross-device sync).
 */
export async function fetchAndApplyUserPreferences(uid: string): Promise<void> {
  const prefs = await getUserPreferences(uid);
  if (!prefs || Object.keys(prefs).length === 0) return;
  await applyUserPreferencesToDevice(prefs);
}

export async function applyUserPreferencesToDevice(prefs: UserPreferences): Promise<void> {
  if (Platform.OS !== 'android') return;

  const landline = useLandlineStore.getState();
  const autoReply = useAutoReplyStore.getState();

  try {
    if (prefs.landlineModeOn !== undefined) {
      if (prefs.landlineModeOn && !landline.isActive) {
        await landline.activateLandlineMode();
      } else if (!prefs.landlineModeOn && landline.isActive) {
        await landline.deactivateLandlineMode();
      }
    }
  } catch (e) {
    console.warn('applyUserPreferencesToDevice landline:', e);
  }

  try {
    if (prefs.autoReplyEnabled !== undefined) {
      if (prefs.autoReplyEnabled && !autoReply.isEnabled) {
        await autoReply.enable();
      } else if (!prefs.autoReplyEnabled && autoReply.isEnabled) {
        await autoReply.disable();
      }
    }
  } catch (e) {
    console.warn('applyUserPreferencesToDevice auto-reply:', e);
  }

  landline.checkStatus();
  autoReply.checkStatus();
}
