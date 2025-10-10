package expo.modules.autoreplymanager

import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import androidx.annotation.RequiresApi

@RequiresApi(Build.VERSION_CODES.VANILLA_ICE_CREAM)
class AutoReplyListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "AutoReplyListener"
        private const val PREFS_NAME = "auto_reply_prefs"
        private const val KEY_ENABLED = "auto_reply_enabled"
        private const val KEY_REPLY_MESSAGE = "default_reply_message"
        private const val KEY_ALLOWED_APPS = "allowed_apps"
        private const val KEY_REPLY_HISTORY = "reply_history"
        
        private var serviceInstance: AutoReplyListenerService? = null
        
        fun isServiceRunning(): Boolean = serviceInstance != null
    }

    private val notificationManager: NotificationManager by lazy {
        getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }

    private val repliedNotifications = mutableSetOf<String>()

    override fun onCreate() {
        super.onCreate()
        serviceInstance = this
        Log.d(TAG, "AutoReplyListenerService created")
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceInstance = null
        Log.d(TAG, "AutoReplyListenerService destroyed")
    }

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.d(TAG, "NotificationListener connected")
    }

    override fun onListenerDisconnected() {
        super.onListenerDisconnected()
        Log.d(TAG, "NotificationListener disconnected")
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        super.onNotificationPosted(sbn)
        
        Log.d(TAG, "Notification posted from: ${sbn.packageName}")
        
        if (!isAutoReplyEnabled()) {
            Log.d(TAG, "Auto-reply is disabled, ignoring notification")
            return
        }

        val packageName = sbn.packageName
        if (!isAppAllowed(packageName)) {
            Log.d(TAG, "App $packageName not in allowed list")
            return
        }

        val notification = sbn.notification
        if (!hasReplyAction(notification)) {
            Log.d(TAG, "Notification from $packageName has no reply action")
            return
        }

        // Simple deduplication using notification key
        val notificationKey = sbn.key
        if (repliedNotifications.contains(notificationKey)) {
            Log.d(TAG, "Already replied to notification with key: $notificationKey, skipping")
            return
        }

        Log.d(TAG, "Processing notification from $packageName (Key: $notificationKey)")
        repliedNotifications.add(notificationKey)
        handleAutoReply(notification, packageName)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification) {
        super.onNotificationRemoved(sbn)
        Log.d(TAG, "Notification removed from: ${sbn.packageName}")
        // Remove from replied set when notification is dismissed
        repliedNotifications.remove(sbn.key)
    }



    private fun isAutoReplyEnabled(): Boolean {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getBoolean(KEY_ENABLED, false)
    }

    private fun isAppAllowed(packageName: String): Boolean {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val allowedApps = prefs.getStringSet(KEY_ALLOWED_APPS, emptySet()) ?: emptySet()
        return allowedApps.isEmpty() || allowedApps.contains(packageName)
    }

    private fun hasReplyAction(notification: Notification): Boolean {
        val actions = notification.actions ?: return false
        return actions.any { action ->
            action.remoteInputs?.any { it.allowFreeFormInput } == true
        }
    }

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

    private fun findReplyAction(notification: Notification): Notification.Action? {
        return notification.actions?.firstOrNull { action ->
            action.remoteInputs?.any { it.allowFreeFormInput } == true
        }
    }

    private fun findRemoteInput(action: Notification.Action): RemoteInput? {
        return action.remoteInputs?.firstOrNull { it.allowFreeFormInput }
    }

    private fun getReplyMessage(): String {
        val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return prefs.getString(KEY_REPLY_MESSAGE, "Auto-reply: I'll get back to you soon.") 
            ?: "Auto-reply: I'll get back to you soon."
    }

    private fun sendReply(action: Notification.Action, remoteInput: RemoteInput, message: String) {
        val intent = Intent()
        val bundle = Bundle()
        bundle.putCharSequence(remoteInput.resultKey, message)
        RemoteInput.addResultsToIntent(arrayOf(remoteInput), intent, bundle)

        action.actionIntent.send(this, 0, intent)
        
        saveReplyToHistory(message)
    }
    
    private fun saveReplyToHistory(message: String) {
        try {
            val prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
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

    fun getActiveNotificationsList(): Array<StatusBarNotification> {
        return try {
            activeNotifications ?: emptyArray()
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get active notifications", e)
            emptyArray()
        }
    }
}
