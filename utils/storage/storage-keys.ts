/**
 * Centralized storage keys for the Landline application
 * 
 * This file contains all storage keys used throughout the app
 * to ensure consistency and make data deletion easier.
 */

/**
 * AsyncStorage keys used in React Native layer
 */
export const STORAGE_KEYS = {
  // User Legal & Compliance
  TERMS_ACCEPTANCE: '@landline_terms_acceptance',
  
  // Future keys can be added here as the app grows:
  // USER_PREFERENCES: '@landline_user_preferences',
  // NOTIFICATION_SETTINGS: '@landline_notification_settings',
  // THEME_PREFERENCE: '@landline_theme',
  // LAST_SYNC_TIME: '@landline_last_sync',
} as const;

/**
 * Native storage identifiers (SharedPreferences on Android)
 * These are for reference and documentation purposes
 */
export const NATIVE_STORAGE = {
  // Android SharedPreferences names
  LANDLINE_MODE_PREFS: 'landline_mode_prefs',
  NOTIFICATION_LOGS: 'landline_notifications',
  
  // Keys within SharedPreferences
  KEYS: {
    IS_LANDLINE_MODE_ACTIVE: 'is_landline_mode_active',
    NOTIFICATION_LOGS_DATA: 'notification_logs',
  },
} as const;

/**
 * Get all AsyncStorage keys that belong to Landline
 * Useful for bulk operations like data export or deletion
 */
export function getAllLandlineStorageKeys(): string[] {
  return Object.values(STORAGE_KEYS);
}

/**
 * Check if a storage key belongs to Landline
 */
export function isLandlineStorageKey(key: string): boolean {
  return key.startsWith('@landline_');
}
