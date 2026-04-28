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

        @JvmStatic
        fun clearEmergencyContactsCache() {
            serviceInstance?.cachedEmergencyContacts = null
        }

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
            
            // For call notifications, label them clearly so they are identifiable in the log
            if (notification.category == Notification.CATEGORY_CALL) {
                return "Incoming call"
            }

            // Final fallback: just return EXTRA_TEXT even if potentially censored
            val finalText = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: ""
            if (finalText.isBlank()) {
                return extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
            }
            return finalText
        }

        /**
         * Robustly extract title from a notification, including call notifications.
         */
        fun extractNotificationTitle(notification: Notification): String {
            val extras = notification.extras ?: return ""

            // Try standard EXTRA_TITLE first
            var title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""

            // Try CONVERSATION_TITLE for MessagingStyle notifications
            if (title.isBlank()) {
                extras.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()?.let { title = it }
            }

            // For call notifications (CATEGORY_CALL), the caller is in EXTRA_CALL_PERSON
            // or the person Uri. Fall back to a generic "Incoming Call" label.
            if (title.isBlank() && notification.category == Notification.CATEGORY_CALL) {
                val person = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                    extras.getParcelable<android.app.Person>("android.callPerson")?.name?.toString()
                        ?: extras.getParcelable<android.app.Person>(Notification.EXTRA_CALL_PERSON)?.name?.toString()
                } else null
                title = person ?: extras.getCharSequence("android.callPerson.name")?.toString() ?: "Incoming Call"
            }

            return title
        }

        private fun isCensored(text: String): Boolean {
            val trimmed = text.trim()
            if (trimmed.isEmpty()) return true
            return trimmed.equals("Sensitive notification content hidden", ignoreCase = true) ||
                   trimmed.equals("Content hidden", ignoreCase = true)
        }

        /**
         * Returns true if the notification is from a group conversation.
         * Uses MessagingStyle.isGroupConversation (set by WhatsApp, Signal, Telegram,
         * Google Messages, etc.) and falls back to checking for a non-blank
         * EXTRA_CONVERSATION_TITLE which apps also set for named group threads.
         */
        fun isGroupConversation(notification: Notification): Boolean {
            val style = NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(notification)
            if (style != null) {
                if (style.isGroupConversation) return true
                if (!style.conversationTitle.isNullOrBlank()) return true
            }
            val extras = notification.extras ?: return false
            return !extras.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE).isNullOrBlank()
        }

        /**
         * Extracts group metadata from a notification.
         * Returns a Pair of (groupName, senderName).
         * Both may be blank if the information is not available.
         */
        fun extractGroupInfo(notification: Notification): Pair<String, String> {
            val extras = notification.extras

            // Group name: prefer MessagingStyle conversationTitle, fall back to extra
            val style = NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(notification)
            val groupName = (style?.conversationTitle?.toString()?.takeIf { it.isNotBlank() }
                ?: extras?.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)?.toString()
                ?: "").trim()

            // Sender: the person on the last MessagingStyle message
            val senderName = (style?.messages?.lastOrNull()?.person?.name?.toString()
                ?: "").trim()

            return Pair(groupName, senderName)
        }
    }
    
    private val repliedNotifications = mutableSetOf<String>()
    private val repliedWithMessage = mutableMapOf<String, String>()
    private val emergencyAlertedNotifications = mutableSetOf<String>()
    // Maps sbn.key -> last logged (contentKey + postTime) string.
    // Used to deduplicate rapid re-posts of the exact same notification event while
    // still logging genuinely new messages — even if they share the same text content
    // (e.g. "ok" sent twice in a row will have different postTimes and are both logged).
    private val loggedNotificationContent = mutableMapOf<String, String>()
    // Tracks keys of notifications we have deliberately cancelled so that if the
    // originating app reposts the same notification we cancel it again without
    // re-logging (avoiding the "second-message shows as normal DND notification" bug).
    private val cancelledNotificationKeys = mutableSetOf<String>()
    
    private var rebindAttemptCount = 0
    private val rebindHandler = android.os.Handler(android.os.Looper.getMainLooper())

    @Volatile internal var cachedEmergencyContacts: List<EmergencyContactEntry>? = null
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
            
            // Skip if notification is from our own app, system notifications, or navigation
            if (shouldSkipNotification(packageName, title, text, notification)) {
                return
            }

            // Skip re-posts of notifications we already replied to (app updates same key
            // after a RemoteInput reply to show the sent message bubble).
            if (repliedWithMessage.containsKey(sbn.key)) {
                Log.d(TAG, "Skipping confirmation re-notification for already-replied key: ${sbn.key}")
                return
            }

            val appName = getAppName(packageName)
            val isEmergencyContactNotification = isFromEmergencyContact(title, text)

            // Compute content key early so we can use it in the repost check below.
            // Including postTime means two messages with identical text but different
            // post times are treated as distinct events and both get logged.
            // A true repost by the SMS app (after we cancel) keeps the same postTime,
            // so it still deduplicates correctly.
            val contentKey = "$title|$text|${sbn.postTime}"

            // If this key was previously cancelled (non-emergency repost), decide whether
            // to cancel again silently or to treat this as a genuinely new message.
            if (cancelledNotificationKeys.contains(sbn.key)) {
                if (isEmergencyContactNotification) {
                    // Emergency contact - remove from cancelled set so it shows normally.
                    Log.d(TAG, "Emergency contact repost - removing cancel suppression for ${sbn.key}")
                    cancelledNotificationKeys.remove(sbn.key)
                    // Fall through to log and let it show (do not cancel below).
                } else if (loggedNotificationContent[sbn.key] == contentKey) {
                    // Same content as the last logged notification - this is the SMS app
                    // reposting immediately after we cancelled it. Cancel again silently.
                    Log.d(TAG, "Repost of previously cancelled key ${sbn.key} with same content - cancelling again without re-logging")
                    try {
                        cancelNotification(sbn.key)
                    } catch (e: Exception) {
                        Log.w(TAG, "Could not re-cancel reposted notification", e)
                    }
                    return
                } else {
                    // Different content means a genuine new message arrived in the same
                    // conversation thread. Remove the cancellation lock so it is fully
                    // processed (logged and cancelled fresh).
                    Log.d(TAG, "New content detected for previously cancelled key ${sbn.key} - treating as new message")
                    cancelledNotificationKeys.remove(sbn.key)
                    // Fall through to normal processing below.
                }
            }

            // Deduplicate: skip if we already logged this exact key+text combination
            // and it has not been unlocked above. Handles apps that post the same
            // notification twice in quick succession for unrelated reasons.
            if (loggedNotificationContent[sbn.key] == contentKey) {
                Log.d(TAG, "Already logged key ${sbn.key} with same content, skipping duplicate")
                // Still cancel if it's a non-emergency duplicate
                if (!isEmergencyContactNotification) {
                    try {
                        cancelNotification(sbn.key)
                    } catch (e: Exception) {
                        Log.w(TAG, "Could not cancel duplicate non-emergency notification", e)
                    }
                }
                return
            }
            loggedNotificationContent[sbn.key] = contentKey

            // Auto-reply only to emergency contacts — they get a response so they know
            // the user is in Landline Mode; non-emergency contacts are silently suppressed.
            val autoReplied = if (autoReplyEnabled && isEmergencyContactNotification) {
                handleAutoReplyIfNeeded(sbn, notification, packageName)
            } else {
                false
            }

            val replyText = if (autoReplied) repliedWithMessage[sbn.key] ?: getReplyMessage() else ""
            val isGroupChat = isGroupConversation(notification)
            val (groupName, groupSender) = if (isGroupChat) extractGroupInfo(notification) else Pair("", "")
            logNotification(
                packageName = packageName,
                appName = appName,
                title = title,
                text = text,
                timestamp = timestamp,
                notificationId = notificationId,
                autoReplied = autoReplied,
                replyText = replyText,
                isGroupChat = isGroupChat,
                groupName = groupName,
                groupSender = groupSender
            )
            Log.d(TAG, "Logged notification from $appName: $title")

            // Emergency contacts: leave the original notification completely untouched.
            // The DND policy allows messages from any sender, so the SMS app's own
            // notification will show and ring normally through the shade. We have already
            // logged it above — nothing else to do.
            // Non-emergency: cancel and track the key so reposts are also suppressed.
            if (isEmergencyContactNotification) {
                Log.d(TAG, "Emergency contact - leaving notification untouched so it shows normally")
            } else {
                Log.d(TAG, "Non-emergency - cancelling from shade")
                cancelledNotificationKeys.add(sbn.key)
                try {
                    cancelNotification(sbn.key)
                } catch (e: Exception) {
                    Log.w(TAG, "Could not cancel non-emergency notification", e)
                }
            }

        } catch (e: Exception) {
            Log.e(TAG, "Error processing notification", e)
        }
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        super.onNotificationRemoved(sbn)
        Log.d(TAG, "Notification removed: ${sbn.packageName}")
        
        repliedNotifications.remove(sbn.key)
        repliedWithMessage.remove(sbn.key)
        emergencyAlertedNotifications.remove(sbn.key)
        // Do NOT clear loggedNotificationContent here - if we cancel a notification
        // the app may immediately repost the same key+text, and we don't want to
        // log it twice. The content map naturally allows re-logging when new message
        // text arrives (different content = new entry logged).
        //
        // Do NOT clear cancelledNotificationKeys here either - the removal event fires
        // immediately after we call cancelNotification(), so clearing it here would undo
        // the protection against same-content reposts by the SMS app.
        // The set is cleared when a new unique message arrives (different contentKey),
        // meaning a genuine new SMS always gets logged and processed correctly.
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

    private fun shouldSkipNotification(packageName: String, title: String, text: String, notification: android.app.Notification): Boolean {
        // Prevent the emergency alert we post from being processed/logged again.
        if (title.startsWith("Emergency Contact:")) {
            return true
        }

        // Skip our own app's notifications
        if (packageName == this.packageName) {
            return true
        }

        // Skip pure system UI notifications
        if (packageName == "android" || packageName == "com.android.systemui") {
            return true
        }

        // Skip navigation notifications (e.g. Google Maps turn-by-turn directions).
        // Apps that correctly declare CATEGORY_NAVIGATION are automatically excluded;
        // users can manually manage unsupported apps via the notification filter later.
        if (notification.category == android.app.Notification.CATEGORY_NAVIGATION) {
            Log.d(TAG, "Skipping navigation notification from $packageName")
            return true
        }

        // Skip only if BOTH title and text are empty AND it is not a call notification.
        // Phone dialer call notifications often have empty title/text but carry caller
        // info in extras — we extract those separately and allow them through.
        if (title.isEmpty() && text.isEmpty()) {
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
        replyText: String = "",
        isGroupChat: Boolean = false,
        groupName: String = "",
        groupSender: String = ""
    ) {
        val prefs = getSharedPreferences("landline_notifications", MODE_PRIVATE)
        val existingLogs = prefs.getString("notification_logs", "") ?: ""

        // Sanitize fields to avoid breaking the line-based format
        val sanitizedTitle = title.replace("\n", " ").replace("|", " ")
        val sanitizedText = text.replace("\n", " ").replace("|", " ")
        val sanitizedReplyText = replyText.replace("\n", " ").replace("|", " ")
        val sanitizedGroupName = groupName.replace("\n", " ").replace("|", " ")
        val sanitizedGroupSender = groupSender.replace("\n", " ").replace("|", " ")

        // Format: timestamp|packageName|appName|title|text|postTime|id|autoReplied|replyText|isGroupChat|groupName|groupSender
        val logEntry = "${System.currentTimeMillis()}|$packageName|$appName|$sanitizedTitle|$sanitizedText|$timestamp|$notificationId|${if (autoReplied) "1" else "0"}|$sanitizedReplyText|${if (isGroupChat) "1" else "0"}|$sanitizedGroupName|$sanitizedGroupSender"
        
        val updatedLogs = if (existingLogs.isEmpty()) {
            logEntry
        } else {
            "$existingLogs\n$logEntry"
        }
        
        // Save to SharedPreferences (temporary solution)
        prefs.edit().putString("notification_logs", updatedLogs).apply()
    }
    
    // Auto-Reply Functionality
    
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

        // Skip auto-reply for group conversations — sending a generic reply to a group
        // chat would be disruptive and expose the user's Landline Mode to everyone.
        if (isGroupConversation(notification)) {
            Log.d(TAG, "Skipping auto-reply for group conversation from $packageName")
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

    // Emergency Contacts

    internal data class EmergencyContactEntry(val name: String, val phone: String)

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

    private fun matchesEmergencyContact(field: String, ec: EmergencyContactEntry): Boolean {
        if (field.isBlank()) return false

        // 1. Match by contact name (case-insensitive).
        //    SMS apps show the saved contact name as the notification title.
        if (ec.name.isNotBlank() && field.trim().equals(ec.name.trim(), ignoreCase = true)) {
            return true
        }

        // 2. Match by phone number digits (last 10 digits for flexibility).
        val normalizedPhone = normalizePhone(ec.phone)
        if (normalizedPhone.length < 7) return false

        val fieldDigits = normalizePhone(field)
        if (fieldDigits.length < 7) return false

        val phoneLast = normalizedPhone.takeLast(10)
        val fieldLast = fieldDigits.takeLast(10)
        return phoneLast == fieldLast
    }

    private fun isFromEmergencyContact(title: String, text: String): Boolean {
        val contacts = loadEmergencyContacts()
        if (contacts.isEmpty()) {
            Log.w(TAG, "No emergency contacts loaded - check that contacts were saved correctly")
            return false
        }
        Log.d(TAG, "Checking against ${contacts.size} emergency contact(s): ${contacts.map { it.name + "/" + it.phone }}")
        val match = contacts.any {
            matchesEmergencyContact(title, it) || matchesEmergencyContact(text, it)
        }
        Log.d(TAG, "isFromEmergencyContact(title='$title', text='${text.take(40)}'): $match")
        return match
    }

    private fun postEmergencyAlert(appName: String, title: String, text: String) {
        try {
            // Android silently ignores setBypassDnd(true) when re-registering an existing
            // channel with the same ID — the OS locks channel settings after first creation.
            // To guarantee bypass-DND is active we delete any legacy channel ID and always
            // use a versioned ID that is fresh on this install.
            val channelId = "emergency_contact_alert_v2"

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                // Delete the old channel so it no longer appears in app settings.
                nm.deleteNotificationChannel("emergency_contact_alert")

                // Create (or no-op if already exists with correct settings) the versioned
                // channel. On first creation setBypassDnd(true) is honoured by the OS.
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
                            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE),
                            android.media.AudioAttributes.Builder()
                                .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
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
