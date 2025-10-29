package expo.modules.notificationapimanager

import android.app.Notification
import android.content.Intent
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * NotificationListenerService for capturing notifications during Landline Mode.
 * 
 * This service listens for all notifications posted to the device and logs them
 * when Landline mode is active. It requires special permission from the user
 * (BIND_NOTIFICATION_LISTENER_SERVICE).
 * 
 * Important:
 * - User must explicitly grant notification access in Settings
 * - This service runs independently and can capture notifications even when app is closed
 * - Respects user privacy by only logging when Landline mode is enabled
 */
class LandlineNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "LandlineNotifListener"
        private const val PREFS_NAME = "landline_mode_prefs"
        private const val KEY_LANDLINE_MODE = "is_landline_mode_active"
        
        // Notification data keys for logging
        const val KEY_PACKAGE_NAME = "packageName"
        const val KEY_APP_NAME = "appName"
        const val KEY_TITLE = "title"
        const val KEY_TEXT = "text"
        const val KEY_TIMESTAMP = "timestamp"
        const val KEY_ID = "id"
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "NotificationListener connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "NotificationListener disconnected")
        
        // Request reconnection if Android automatically disconnected us
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            requestRebind(android.content.ComponentName(this, this::class.java))
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        
        Log.d(TAG, "Notification received from: ${sbn.packageName}")
        Log.d(TAG, "Landline mode active: ${isLandlineModeActive()}")
        
        // Only log notifications when Landline mode is active
        if (!isLandlineModeActive()) {
            Log.d(TAG, "Landline mode is not active, skipping notification")
            return
        }

        try {
            val notification = sbn.notification
            val extras = notification?.extras
            
            if (extras == null) {
                Log.w(TAG, "Notification extras are null, skipping")
                return
            }

            // Extract notification data
            val packageName = sbn.packageName ?: "unknown"
            val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            val timestamp = sbn.postTime
            val notificationId = sbn.id

            // Skip if notification is from our own app or system notifications
            if (shouldSkipNotification(packageName, title, text)) {
                return
            }

            // Get app name
            val appName = getAppName(packageName)

            // Log the notification
            logNotification(
                packageName = packageName,
                appName = appName,
                title = title,
                text = text,
                timestamp = timestamp,
                notificationId = notificationId
            )

            Log.d(TAG, "Logged notification from $appName: $title")

        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        super.onNotificationRemoved(sbn)
        // Optional: Handle when notification is dismissed
        Log.d(TAG, "Notification removed: ${sbn.packageName}")
    }

    /**
     * Check if Landline mode is currently active
     */
    private fun isLandlineModeActive(): Boolean {
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        return prefs.getBoolean(KEY_LANDLINE_MODE, false)
    }

    /**
     * Determine if notification should be skipped (filtered out)
     */
    private fun shouldSkipNotification(packageName: String, title: String, text: String): Boolean {
        // TEMPORARILY DISABLED FOR TESTING: Skip our own app's notifications to avoid recursion
        // if (packageName == this.packageName) {
        //     return true
        // }

        // Skip empty notifications
        if (title.isEmpty() && text.isEmpty()) {
            return true
        }

        // Skip system notifications (optional - can be configured)
        if (packageName == "android" || packageName == "com.android.systemui") {
            return true
        }

        return false
    }

    /**
     * Get the human-readable app name from package name
     */
    private fun getAppName(packageName: String): String {
        return try {
            val packageManager = applicationContext.packageManager
            val appInfo = packageManager.getApplicationInfo(packageName, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            packageName // Fall back to package name if can't get app name
        }
    }

    /**
     * Log notification to persistent storage
     * For now, logs to SharedPreferences. Later can be moved to database.
     */
    private fun logNotification(
        packageName: String,
        appName: String,
        title: String,
        text: String,
        timestamp: Long,
        notificationId: Int
    ) {
        val prefs = getSharedPreferences("landline_notifications", MODE_PRIVATE)
        val existingLogs = prefs.getString("notification_logs", "") ?: ""
        
        // Create notification JSON entry
        val notificationData = mapOf(
            KEY_PACKAGE_NAME to packageName,
            KEY_APP_NAME to appName,
            KEY_TITLE to title,
            KEY_TEXT to text,
            KEY_TIMESTAMP to timestamp,
            KEY_ID to notificationId
        )
        
        // Convert to simple string format (will be improved with database later)
        val logEntry = "${System.currentTimeMillis()}|$packageName|$appName|$title|$text|$timestamp|$notificationId"
        
        val updatedLogs = if (existingLogs.isEmpty()) {
            logEntry
        } else {
            "$existingLogs\n$logEntry"
        }
        
        // Save to SharedPreferences (temporary solution)
        prefs.edit().putString("notification_logs", updatedLogs).apply()
        
        // Also broadcast the notification for real-time updates
        broadcastNotification(notificationData)
    }

    /**
     * Broadcast notification event for real-time UI updates
     */
    private fun broadcastNotification(notificationData: Map<String, Any>) {
        val intent = Intent("com.landlineapp.NOTIFICATION_RECEIVED").apply {
            putExtra(KEY_PACKAGE_NAME, notificationData[KEY_PACKAGE_NAME] as String)
            putExtra(KEY_APP_NAME, notificationData[KEY_APP_NAME] as String)
            putExtra(KEY_TITLE, notificationData[KEY_TITLE] as String)
            putExtra(KEY_TEXT, notificationData[KEY_TEXT] as String)
            putExtra(KEY_TIMESTAMP, notificationData[KEY_TIMESTAMP] as Long)
            putExtra(KEY_ID, notificationData[KEY_ID] as Int)
        }
        sendBroadcast(intent)
    }
}

