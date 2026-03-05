package expo.modules.notificationapimanager

import android.app.Notification
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * Unified NotificationListenerService for Landline app.
 * 
 * This service handles both:
 * 1. Capturing and logging notifications during Landline Mode
 * 2. Sending auto-replies to messaging notifications when auto-reply is enabled
 * 
 * It requires special permission from the user (BIND_NOTIFICATION_LISTENER_SERVICE).
 * 
 * Important:
 * - User must explicitly grant notification access in Settings
 * - This service runs independently and can capture notifications even when app is closed
 * - Respects user privacy by only logging when Landline mode is enabled
 * - Respects user preferences by only auto-replying when auto-reply is enabled
 */
class LandlineNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "LandlineNotifListener"
        private const val PREFS_NAME = "landline_mode_prefs"
        private const val KEY_LANDLINE_MODE = "is_landline_mode_active"
        
        // Auto-reply preferences
        private const val AUTO_REPLY_PREFS_NAME = "auto_reply_prefs"
        private const val KEY_AUTO_REPLY_ENABLED = "auto_reply_enabled"
        private const val KEY_REPLY_MESSAGE = "default_reply_message"
        private const val KEY_ALLOWED_APPS = "allowed_apps"
        private const val KEY_REPLY_HISTORY = "reply_history"
        
        // Notification data keys for logging
        const val KEY_PACKAGE_NAME = "packageName"
        const val KEY_APP_NAME = "appName"
        const val KEY_TITLE = "title"
        const val KEY_TEXT = "text"
        const val KEY_TIMESTAMP = "timestamp"
        const val KEY_ID = "id"
        
        private var serviceInstance: LandlineNotificationListenerService? = null
        
        fun isServiceRunning(): Boolean = serviceInstance != null
    }
    
    private val repliedNotifications = mutableSetOf<String>()

    override fun onCreate() {
        super.onCreate()
        serviceInstance = this
        Log.d(TAG, "LandlineNotificationListenerService created")
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceInstance = null
        Log.d(TAG, "LandlineNotificationListenerService destroyed")
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
        
        val landlineModeActive = isLandlineModeActive()
        val autoReplyEnabled = isAutoReplyEnabled()
        
        Log.d(TAG, "Landline mode: $landlineModeActive, Auto-reply: $autoReplyEnabled")
        
        // If neither feature is enabled, skip processing
        if (!landlineModeActive && !autoReplyEnabled) {
            Log.d(TAG, "Neither Landline mode nor auto-reply is active, skipping")
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

            // Handle notification logging if Landline mode is active
            if (landlineModeActive) {
                logNotification(
                    packageName = packageName,
                    appName = appName,
                    title = title,
                    text = text,
                    timestamp = timestamp,
                    notificationId = notificationId
                )
                Log.d(TAG, "Logged notification from $appName: $title")
            }
            
            // Handle auto-reply if enabled
            if (autoReplyEnabled) {
                handleAutoReplyIfNeeded(sbn, notification, packageName)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        super.onNotificationRemoved(sbn)
        Log.d(TAG, "Notification removed: ${sbn.packageName}")
        
        // Remove from replied set when notification is dismissed
        repliedNotifications.remove(sbn.key)
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
    
    // ========== Auto-Reply Functionality ==========
    
    /**
     * Check if auto-reply is currently enabled
     */
    private fun isAutoReplyEnabled(): Boolean {
        val prefs = getSharedPreferences(AUTO_REPLY_PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_AUTO_REPLY_ENABLED, false)
    }
    
    /**
     * Handle auto-reply logic for a notification if conditions are met
     */
    private fun handleAutoReplyIfNeeded(
        sbn: StatusBarNotification,
        notification: Notification,
        packageName: String
    ) {
        // Check if app is allowed for auto-reply
        if (!isAppAllowedForAutoReply(packageName)) {
            Log.d(TAG, "App $packageName not in auto-reply allowed list")
            return
        }
        
        // Check if notification has reply action
        if (!hasReplyAction(notification)) {
            Log.d(TAG, "Notification from $packageName has no reply action")
            return
        }
        
        // Check for deduplication
        val notificationKey = sbn.key
        if (repliedNotifications.contains(notificationKey)) {
            Log.d(TAG, "Already replied to notification with key: $notificationKey, skipping")
            return
        }
        
        Log.d(TAG, "Processing auto-reply for $packageName (Key: $notificationKey)")
        repliedNotifications.add(notificationKey)
        handleAutoReply(notification, packageName)
    }
    
    /**
     * Check if an app is allowed for auto-reply
     */
    private fun isAppAllowedForAutoReply(packageName: String): Boolean {
        val prefs = getSharedPreferences(AUTO_REPLY_PREFS_NAME, Context.MODE_PRIVATE)
        val allowedApps = prefs.getStringSet(KEY_ALLOWED_APPS, emptySet()) ?: emptySet()
        return allowedApps.isEmpty() || allowedApps.contains(packageName)
    }
    
    /**
     * Check if notification has a reply action (RemoteInput)
     */
    private fun hasReplyAction(notification: Notification): Boolean {
        val actions = notification.actions ?: return false
        return actions.any { action ->
            action.remoteInputs?.any { it.allowFreeFormInput } == true
        }
    }
    
    /**
     * Handle sending auto-reply to a notification
     */
    private fun handleAutoReply(notification: Notification, packageName: String) {
        try {
            val replyAction = findReplyAction(notification) ?: return
            val remoteInput = findRemoteInput(replyAction) ?: return
            
            val replyMessage = getReplyMessage()
            sendReply(replyAction, remoteInput, replyMessage)
            
            Log.d(TAG, "Auto-reply sent to $packageName: $replyMessage")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send auto-reply", e)
        }
    }
    
    /**
     * Find the first reply action in a notification
     */
    private fun findReplyAction(notification: Notification): Notification.Action? {
        return notification.actions?.firstOrNull { action ->
            action.remoteInputs?.any { it.allowFreeFormInput } == true
        }
    }
    
    /**
     * Find the RemoteInput from an action
     */
    private fun findRemoteInput(action: Notification.Action): RemoteInput? {
        return action.remoteInputs?.firstOrNull { it.allowFreeFormInput }
    }
    
    /**
     * Get the configured auto-reply message
     */
    private fun getReplyMessage(): String {
        val prefs = getSharedPreferences(AUTO_REPLY_PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_REPLY_MESSAGE, "Auto-reply: I'll get back to you soon.") 
            ?: "Auto-reply: I'll get back to you soon."
    }
    
    /**
     * Send the auto-reply via RemoteInput
     */
    private fun sendReply(action: Notification.Action, remoteInput: RemoteInput, message: String) {
        val intent = Intent()
        val bundle = Bundle()
        bundle.putCharSequence(remoteInput.resultKey, message)
        RemoteInput.addResultsToIntent(arrayOf(remoteInput), intent, bundle)

        action.actionIntent.send(this, 0, intent)
        
        saveReplyToHistory(message)
    }
    
    /**
     * Save reply to history for tracking
     */
    private fun saveReplyToHistory(message: String) {
        try {
            val prefs = getSharedPreferences(AUTO_REPLY_PREFS_NAME, Context.MODE_PRIVATE)
            val historyJson = prefs.getString(KEY_REPLY_HISTORY, "[]")
            val history = org.json.JSONArray(historyJson)
            
            val replyRecord = org.json.JSONObject()
            replyRecord.put("message", message)
            replyRecord.put("timestamp", System.currentTimeMillis())
            
            history.put(replyRecord)
            
            val maxHistorySize = 50
            val trimmedHistory = if (history.length() > maxHistorySize) {
                org.json.JSONArray((0 until history.length()).drop(history.length() - maxHistorySize).map { history.get(it) })
            } else {
                history
            }
            
            prefs.edit().putString(KEY_REPLY_HISTORY, trimmedHistory.toString()).apply()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to save reply history", e)
        }
    }
    
    /**
     * Get list of currently active notifications
     */
    fun getActiveNotificationsList(): Array<StatusBarNotification> {
        return try {
            activeNotifications ?: emptyArray()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get active notifications", e)
            emptyArray()
        }
    }
}

