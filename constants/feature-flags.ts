/**
 * Feature flags for the release build.
 *
 * Set a flag to false to disable the feature at runtime without deleting any code.
 * The permissions for disabled features must also be absent from the manifests —
 * see PERMISSION-BACKUP-PLAN.md for the full checklist.
 */

/**
 * Foreground Service (FOREGROUND_SERVICE + FOREGROUND_SERVICE_SPECIAL_USE)
 *
 * When true:  a persistent status-bar notification is shown while Landline Mode
 *             is active and helps keep the process alive on aggressive OEM ROMs.
 * When false: Landline Mode still works on stock Android; notification capture
 *             continues via the system-bound NotificationListenerService.
 *
 * Disabled for the initial Play Store release to avoid the FOREGROUND_SERVICE_SPECIAL_USE
 * declaration requirement. Re-enable once the Play Store declaration is approved.
 */
export const ENABLE_FOREGROUND_SERVICE = false;

/**
 * QUERY_ALL_PACKAGES — installed-app enumeration
 *
 * When true:  the app can list all installed packages (used by the App Selection
 *             screen and the debug "Get Installed Apps" button).
 * When false: the App Selection screen is hidden and getAllInstalledApps() is
 *             never called.
 *
 * Disabled for the initial Play Store release. The App Selection feature is
 * incomplete (uses hardcoded mock data) and does not affect notification capture.
 */
export const ENABLE_QUERY_ALL_PACKAGES = false;
