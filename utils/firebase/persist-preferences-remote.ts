import { Platform } from 'react-native';

import { auth } from '@/utils/firebase/auth';
import { mergeUserPreferences } from '@/utils/firebase/user-service';

/**
 * Best-effort sync of device state to Firestore when the user is signed in.
 * Called from stores after successful native updates so toggles from any screen
 * (Landline tab, Home, Debug Tools, Profile) stay in sync across devices.
 */
export function persistLandlineModePreference(isActive: boolean): void {
  if (Platform.OS !== 'android') return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  mergeUserPreferences(uid, { landlineModeOn: isActive }).catch((e) =>
    console.warn('persistLandlineModePreference:', e),
  );
}

export function persistAutoReplyEnabledPreference(enabled: boolean): void {
  if (Platform.OS !== 'android') return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  mergeUserPreferences(uid, { autoReplyEnabled: enabled }).catch((e) =>
    console.warn('persistAutoReplyEnabledPreference:', e),
  );
}

export function persistRetentionPreference(days: number): void {
  if (Platform.OS !== 'android') return;
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  mergeUserPreferences(uid, { notificationRetentionDays: days }).catch((e) =>
    console.warn('persistRetentionPreference:', e),
  );
}
