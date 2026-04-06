package expo.modules.notificationapimanager

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.core.app.NotificationCompat

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

        /** When enabled and at least one app or emergency number is set, non-matching notifications are cancelled. */
        private const val KEY_NOTIFICATION_FILTER_ENABLED = "notification_filter_enabled"
        private const val KEY_ALLOWED_NOTIFICATION_PACKAGES = "allowed_notification_packages"
        private const val KEY_EMERGENCY_PHONE_DIGITS = "emergency_phone_digits"
        
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
        
        @JvmStatic
        internal var serviceInstance: LandlineNotificationListenerService? = null
        
        @JvmStatic
        fun isServiceRunning(): Boolean = serviceInstance != null

        @JvmStatic
        fun getInstance(): LandlineNotificationListenerService? = serviceInstance

        /**
         * Robustly extract text from a notification, trying multiple sources
         * and bypassing system censorship if possible.
         */
        fun extractNotificationText(notification: Notification): String {
            val extras = notification.extras ?: return ""
            
            // Priority 1: NotificationCompat.MessagingStyle which handles SMS apps properly
            val style = NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(notification)
            if (style != null) {
                val messages = style.messages
                if (!messages.isNullOrEmpty()) {
                    // Only take the last message to avoid building up history
                    val lastMessage = messages.last()
                    val text = lastMessage.text?.toString()
                    if (!text.isNullOrBlank() && !isCensored(text)) {
                        Log.d(TAG, "Got text from MessagingStyle (last message): ${text.take(50)}")
                        return text
                    }
                }
            }
            
            // Priority 2: EXTRA_BIG_TEXT (often uncensored when EXTRA_TEXT is hidden)
            extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.takeIf { it.isNotBlank() && !isCensored(it) }?.let {
                Log.d(TAG, "Got text from BIG_TEXT: ${it.take(50)}")
                return it
            }
            
            // Priority 3: EXTRA_TEXT (most common)
            extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.takeIf { it.isNotBlank() && !isCensored(it) }?.let { 
                Log.d(TAG, "Got text from EXTRA_TEXT: ${it.take(50)}")
                return it 
            }
            
            // Priority 4: MessagingStyle messages from extras (legacy/raw)
            @Suppress("DEPRECATION")
            run {
                val messages = try {
                    extras.getParcelableArray(Notification.EXTRA_MESSAGES)
                } catch (e: Exception) {
                    null
                }
                
                if (messages != null && messages.isNotEmpty()) {
                    // Only take the last message
                    try {
                        @Suppress("DEPRECATION")
                        val msgBundle = messages.last() as? android.os.Bundle
                        if (msgBundle != null) {
                            val msgText = msgBundle.getCharSequence("text")?.toString()
                            if (!msgText.isNullOrBlank() && !isCensored(msgText)) {
                                Log.d(TAG, "Got text from EXTRA_MESSAGES (last): ${msgText.take(50)}")
                                return msgText
                            }
                        }
                    } catch (e: Exception) { }
                }
            }
            
            // Priority 5: EXTRA_TITLE_BIG
            val titleBig = extras.getCharSequence("android.title.big")?.toString()
            if (!titleBig.isNullOrBlank() && !isCensored(titleBig)) {
                Log.d(TAG, "Got text from android.title.big: ${titleBig.take(50)}")
                return titleBig
            }

            // Priority 6: SUMMARY_TEXT
            extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT)?.toString()?.takeIf { it.isNotBlank() && !isCensored(it) }?.let {
                Log.d(TAG, "Got text from SUMMARY_TEXT: ${it.take(50)}")
                return it
            }
            
            // Final fallback: just return EXTRA_TEXT even if potentially censored
            val finalText = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            if (finalText.isBlank()) {
                // Last ditch effort: try title as text if text is empty
                return extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            }
            return finalText
        }

        /**
         * Robustly extract title from a notification.
         */
        fun extractNotificationTitle(notification: Notification): String {
            val extras = notification.extras ?: return ""
            
            // Try standard EXTRA_TITLE first
            var title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            
            // Try CONVERSATION_TITLE for MessagingStyle notifications
            if (title.isBlank()) {
                extras.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()?.let { title = it }
            }
            
            return title
        }

        private fun isCensored(text: String): Boolean {
            val trimmed = text.trim()
            if (trimmed.isEmpty()) return true
            return trimmed.equals("Sensitive notification content hidden", ignoreCase = true) ||
                   trimmed.equals("Content hidden", ignoreCase = true) ||
                   trimmed.equals("New message", ignoreCase = true)
        }
    }
    
    private val repliedNotifications = mutableSetOf<String>()
    // Maps sbn.key → the message we sent, so we can (a) skip logging the app's
    // confirmation re-notification and (b) embed the sent text in the original log entry.
    private val repliedWithMessage = mutableMapOf<String, String>()
    private val emergencyAlertedNotifications = mutableSetOf<String>()
    
    private var rebindAttemptCount = 0
    private val rebindHandler = android.os.Handler(android.os.Looper.getMainLooper())

    @Volatile private var cachedEmergencyContacts: List<EmergencyContactEntry>? = null
    private val emergencyContactsPrefsListener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key == "emergency_contacts_json") {
            cachedEmergencyContacts = null
        }
    }

    override fun onCreate() {
        super.onCreate()
        serviceInstance = this
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .registerOnSharedPreferenceChangeListener(emergencyContactsPrefsListener)
        Log.d(TAG, "LandlineNotificationListenerService created")
    }

    override fun onDestroy() {
        super.onDestroy()
        getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
            .unregisterOnSharedPreferenceChangeListener(emergencyContactsPrefsListener)
        rebindHandler.removeCallbacksAndMessages(null)
        serviceInstance = null
        Log.d(TAG, "LandlineNotificationListenerService destroyed")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "NotificationListener connected")
        rebindAttemptCount = 0
        rebindHandler.removeCallbacksAndMessages(null)
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "NotificationListener disconnected")
        
        // Request reconnection if Android automatically disconnected us
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val delayMs = Math.min(Math.pow(2.0, rebindAttemptCount.toDouble()).toLong() * 1000L, 60000L)
            Log.d(TAG, "Requesting rebind in ${delayMs}ms (attempt $rebindAttemptCount)")
            
            rebindHandler.postDelayed({
                try {
                    requestRebind(android.content.ComponentName(this, this::class.java))
                    rebindAttemptCount++
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to request rebind", e)
                }
            }, delayMs)
        }
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        
        Log.d(TAG, "Notification received from: ${sbn.packageName}")
        
        val landlineModeActive = isLandlineModeActive()
        val autoReplyEnabled = isAutoReplyEnabled()
        
        Log.d(TAG, "Landline mode: $landlineModeActive, Auto-reply: $autoReplyEnabled")
        
        // If Landline Mode is off, skip all processing (both logging and auto-reply require it)
        if (!landlineModeActive) {
            Log.d(TAG, "Landline mode is off, skipping")
            return
        }

        try {
            val notification = sbn.notification ?: return
            val extras = notification.extras ?: Bundle()
            
            // Debug: Log all extras keys to understand notification structure
            Log.d(TAG, "Notification from ${sbn.packageName} - Extras keys: ${extras.keySet().joinToString()}")
            
            // Extract notification data using robust helper
            val packageName = sbn.packageName ?: "unknown"
            val title = extractNotificationTitle(notification)
            val text = extractNotificationText(notification)
            val timestamp = sbn.postTime
            val notificationId = sbn.id
            
            Log.d(TAG, "Extracted - Title: '$title', Text: '${text.take(100)}...'")
            
            // Skip if notification is from our own app or system notifications
            if (shouldSkipNotification(packageName, title, text)) {
                return
            }

            // Skip logging the app's confirmation re-notification after we sent a reply.
            // When we fire a RemoteInput reply, the target app updates its notification
            // (same sbn.key) to show the sent message — we don't want that logged as a
            // new entry; the original entry already carries replyText.
            if (repliedWithMessage.containsKey(sbn.key)) {
                Log.d(TAG, "Skipping confirmation re-notification for already-replied key: ${sbn.key}")
                return
            }

            // Whitelist: only allowed apps + emergency numbers may show notifications (others dismissed)
            if (shouldSuppressByNotificationFilter(packageName, title, text)) {
                try {
                    cancelNotification(sbn.key)
                } catch (e: Exception) {
                    Log.w(TAG, "Could not cancel filtered notification", e)
                }
                return
            }

            // Get app name
            val appName = getAppName(packageName)

            val isEmergencyContactNotification =
                landlineModeActive && isFromEmergencyContact(title, text)

            // Check if this notification is from the emergency contact
            if (isEmergencyContactNotification) {
                val notificationKey = sbn.key
                if (emergencyAlertedNotifications.contains(notificationKey)) {
                    Log.d(TAG, "Already posted emergency alert for notification key: $notificationKey, skipping")
                } else {
                    emergencyAlertedNotifications.add(notificationKey)
                    Log.d(TAG, "Notification from emergency contact, alerting user")
                    postEmergencyAlert(appName, title, text)
                }
            }

            // Attempt auto-reply and capture whether a reply was actually sent.
            val autoReplied = if (autoReplyEnabled && landlineModeActive && !isEmergencyContactNotification) {
                handleAutoReplyIfNeeded(sbn, notification, packageName)
            } else {
                false
            }

            // Handle notification logging if Landline mode is active.
            // replyText is looked up after handleAutoReplyIfNeeded fires below; we log
            // after the reply so the message text is available in the same entry.
            if (landlineModeActive) {
                val replyText = if (autoReplied) repliedWithMessage[sbn.key] ?: getReplyMessage() else ""
                logNotification(
                    packageName = packageName,
                    appName = appName,
                    title = title,
                    text = text,
                    timestamp = timestamp,
                    notificationId = notificationId,
                    autoReplied = autoReplied,
                    replyText = replyText
                )
                Log.d(TAG, "Logged notification from $appName: $title")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        super.onNotificationRemoved(sbn)
        Log.d(TAG, "Notification removed: ${sbn.packageName}")
        
        // Remove from replied sets when notification is dismissed
        repliedNotifications.remove(sbn.key)
        repliedWithMessage.remove(sbn.key)
        emergencyAlertedNotifications.remove(sbn.key)
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
    /**
     * When the notification filter is enabled and configured, returns true if this notification
     * should be suppressed (cancelled) because it does not match the whitelist.
     */
    private fun shouldSuppressByNotificationFilter(packageName: String, title: String, text: String): Boolean {
        if (packageName == applicationContext.packageName) {
            return false
        }

        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        if (!prefs.getBoolean(KEY_NOTIFICATION_FILTER_ENABLED, false)) {
            return false
        }

        val allowedPackages = prefs.getStringSet(KEY_ALLOWED_NOTIFICATION_PACKAGES, emptySet()) ?: emptySet()
        val emergencyDigits = prefs.getStringSet(KEY_EMERGENCY_PHONE_DIGITS, emptySet()) ?: emptySet()

        if (allowedPackages.isEmpty() && emergencyDigits.isEmpty()) {
            return false
        }

        if (allowedPackages.contains(packageName)) {
            return false
        }

        val blob = normalizeDigits(title + text)
        for (digits in emergencyDigits) {
            if (digits.length < 7) continue
            if (blob.contains(digits)) {
                return false
            }
            if (digits.length >= 10) {
                val last10 = digits.takeLast(10)
                if (blob.contains(last10)) {
                    return false
                }
            }
        }

        return true
    }

    private fun normalizeDigits(s: String): String {
        return buildString {
            for (c in s) {
                if (c.isDigit()) append(c)
            }
        }
    }

    private fun shouldSkipNotification(packageName: String, title: String, text: String): Boolean {
        // Prevent the emergency alert we post from being processed/logged again.
        if (title.startsWith("Emergency Contact:")) {
            return true
        }

        if (packageName == this.packageName) {
            return true
        }

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
        notificationId: Int,
        autoReplied: Boolean = false,
        replyText: String = ""
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
        
        // Sanitize fields to avoid breaking the line-based format
        val sanitizedTitle = title.replace("\n", " ").replace("|", " ")
        val sanitizedText = text.replace("\n", " ").replace("|", " ")
        val sanitizedReplyText = replyText.replace("\n", " ").replace("|", " ")

        // Format: timestamp|packageName|appName|title|text|postTime|id|autoReplied|replyText
        val logEntry = "${System.currentTimeMillis()}|$packageName|$appName|$sanitizedTitle|$sanitizedText|$timestamp|$notificationId|${if (autoReplied) "1" else "0"}|$sanitizedReplyText"
        
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
     * Handle auto-reply logic for a notification if conditions are met.
     * Returns true if a reply was successfully sent, false otherwise.
     */
    private fun handleAutoReplyIfNeeded(
        sbn: StatusBarNotification,
        notification: Notification,
        packageName: String
    ): Boolean {
        // Check if app is allowed for auto-reply
        if (!isAppAllowedForAutoReply(packageName)) {
            Log.d(TAG, "App $packageName not in auto-reply allowed list")
            return false
        }
        
        // Check if notification has reply action
        if (!hasReplyAction(notification)) {
            Log.d(TAG, "Notification from $packageName has no reply action")
            return false
        }
        
        // Check for deduplication
        val notificationKey = sbn.key
        if (repliedNotifications.contains(notificationKey)) {
            Log.d(TAG, "Already replied to notification with key: $notificationKey, skipping")
            return false
        }
        
        Log.d(TAG, "Processing auto-reply for $packageName (Key: $notificationKey)")
        repliedNotifications.add(notificationKey)
        val sentMessage = handleAutoReply(notification, packageName)
        if (sentMessage != null) {
            repliedWithMessage[notificationKey] = sentMessage
        }
        return sentMessage != null
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
     * Handle sending auto-reply to a notification.
     * Returns the message that was sent, or null if the reply was not sent.
     */
    private fun handleAutoReply(notification: Notification, packageName: String): String? {
        return try {
            val replyAction = findReplyAction(notification) ?: return null
            val remoteInput = findRemoteInput(replyAction) ?: return null

            val replyMessage = getReplyMessage()
            sendReply(replyAction, remoteInput, replyMessage)

            Log.d(TAG, "Auto-reply sent to $packageName: $replyMessage")
            replyMessage
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send auto-reply", e)
            null
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
            val historyJson = prefs.getString("reply_history", "[]")
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
            
            prefs.edit().putString("reply_history", trimmedHistory.toString()).apply()
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

    // ========== Emergency Contacts (multiple) ==========

    private data class EmergencyContactEntry(val name: String, val phone: String)

    private fun loadEmergencyContacts(): List<EmergencyContactEntry> {
        cachedEmergencyContacts?.let { return it }
        val prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
        val json = prefs.getString("emergency_contacts_json", null)
        val result: List<EmergencyContactEntry>
        if (!json.isNullOrBlank()) {
            val parsed = mutableListOf<EmergencyContactEntry>()
            try {
                val arr = org.json.JSONArray(json)
                for (i in 0 until arr.length()) {
                    val o = arr.getJSONObject(i)
                    val n = if (o.has("name")) o.getString("name") else ""
                    val p = if (o.has("phone")) o.getString("phone") else ""
                    if (p.isNotEmpty()) parsed.add(EmergencyContactEntry(n, p))
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to parse emergency_contacts_json", e)
            }
            result = if (parsed.isNotEmpty()) parsed else {
                val legacyName = prefs.getString("emergency_contact_name", null) ?: ""
                val legacyPhone = prefs.getString("emergency_contact_phone", null)
                if (!legacyPhone.isNullOrEmpty()) listOf(EmergencyContactEntry(legacyName, legacyPhone)) else emptyList()
            }
        } else {
            val legacyName = prefs.getString("emergency_contact_name", null) ?: ""
            val legacyPhone = prefs.getString("emergency_contact_phone", null)
            result = if (!legacyPhone.isNullOrEmpty()) {
                listOf(EmergencyContactEntry(legacyName, legacyPhone))
            } else {
                emptyList()
            }
        }
        cachedEmergencyContacts = result
        return result
    }

    private fun normalizePhone(phone: String): String {
        return phone.replace(Regex("[^0-9+]"), "")
    }

    private fun matchesEmergencyContact(title: String, ec: EmergencyContactEntry): Boolean {
        val normalized = normalizePhone(ec.phone)
        if (normalized.length < 7) return false

        val titleDigits = normalizePhone(title)
        val lastDigits = if (normalized.length >= 10) normalized.takeLast(10) else normalized

        if (titleDigits.isNotEmpty()) {
            val titleLastDigits = if (titleDigits.length >= 10) titleDigits.takeLast(10) else titleDigits
            if (titleLastDigits.length < 7) return false
            if (lastDigits.endsWith(titleLastDigits) || titleLastDigits.endsWith(lastDigits)) return true
        }

        return false
    }

    private fun isFromEmergencyContact(title: String, text: String): Boolean {
        return loadEmergencyContacts().any { matchesEmergencyContact(title, it) }
    }

    private fun postEmergencyAlert(appName: String, title: String, text: String) {
        try {
            val channelId = "emergency_contact_alert"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (nm.getNotificationChannel(channelId) == null) {
                    val channel = NotificationChannel(
                        channelId,
                        "Emergency Contact Alerts",
                        NotificationManager.IMPORTANCE_HIGH
                    ).apply {
                        description = "Alerts when your emergency contact reaches you during Landline Mode"
                        lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                        enableVibration(true)
                        setSound(
                            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                            android.media.AudioAttributes.Builder()
                                .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION)
                                .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                        )
                        setBypassDnd(true)
                    }
                    nm.createNotificationChannel(channel)
                }
            }

            val notification = NotificationCompat.Builder(this, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_alert)
                .setContentTitle("Emergency Contact: $title")
                .setContentText(text)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                .setVibrate(longArrayOf(0, 500, 200, 500))
                .build()

            val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            val alertId = (System.currentTimeMillis() % Int.MAX_VALUE).toInt()
            nm.notify(alertId, notification)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to post emergency alert", e)
        }
    }
}
