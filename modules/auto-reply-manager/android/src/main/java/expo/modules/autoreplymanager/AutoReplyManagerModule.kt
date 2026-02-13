package expo.modules.autoreplymanager

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.service.notification.StatusBarNotification
import androidx.annotation.RequiresApi
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class AutoReplyResult : Record {
    @Field
    var success: Boolean = false

    @Field
    var message: String = ""
}

class NotificationInfo : Record {
    @Field
    var packageName: String = ""

    @Field
    var title: String? = null

    @Field
    var text: String? = null

    @Field
    var timestamp: Long = 0

    @Field
    var hasReplyAction: Boolean = false
}

class ReplyHistoryItem : Record {
    @Field
    var message: String = ""

    @Field
    var timestamp: Long = 0
}

class AutoReplyManagerModule : Module() {
    private val context: Context
        get() = requireNotNull(appContext.reactContext)

    companion object {
        private const val PREFS_NAME = "auto_reply_prefs"
        private const val KEY_ENABLED = "auto_reply_enabled"
        private const val KEY_REPLY_MESSAGE = "default_reply_message"
        private const val KEY_ALLOWED_APPS = "allowed_apps"
        private const val KEY_REPLY_HISTORY = "reply_history"
    }

    override fun definition() = ModuleDefinition {
        Name("AutoReplyManager")

        Events("onNotificationReceived", "onAutoReplySent")

        Function("isListenerEnabled") {
            return@Function isNotificationListenerEnabled()
        }

        AsyncFunction("requestListenerPermission") { promise: Promise ->
            try {
                if (isNotificationListenerEnabled()) {
                    promise.resolve(
                        createResult(
                            success = true,
                            message = "Notification listener already enabled"
                        )
                    )
                    return@AsyncFunction
                }

                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)

                promise.resolve(
                    createResult(
                        success = false,
                        message = "Please enable notification access in settings"
                    )
                )
            } catch (e: Exception) {
                promise.reject("PERMISSION_REQUEST_FAILED", "Failed to open settings: ${e.message}", e)
            }
        }

        Function("isAutoReplyEnabled") {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return@Function prefs.getBoolean(KEY_ENABLED, false)
        }

        AsyncFunction("setAutoReplyEnabled") { enabled: Boolean, promise: Promise ->
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putBoolean(KEY_ENABLED, enabled).apply()

                promise.resolve(
                    createResult(
                        success = true,
                        message = if (enabled) "Auto-reply enabled" else "Auto-reply disabled"
                    )
                )
            } catch (e: Exception) {
                promise.reject("SET_ENABLED_FAILED", "Failed to set auto-reply state: ${e.message}", e)
            }
        }

        AsyncFunction("setReplyMessage") { message: String, promise: Promise ->
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putString(KEY_REPLY_MESSAGE, message).apply()

                promise.resolve(
                    createResult(
                        success = true,
                        message = "Reply message updated"
                    )
                )
            } catch (e: Exception) {
                promise.reject("SET_MESSAGE_FAILED", "Failed to set reply message: ${e.message}", e)
            }
        }

        Function("getReplyMessage") {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            return@Function prefs.getString(KEY_REPLY_MESSAGE, "Auto-reply: I'll get back to you soon.")
        }

        AsyncFunction("setAllowedApps") { packageNames: List<String>, promise: Promise ->
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putStringSet(KEY_ALLOWED_APPS, packageNames.toSet()).apply()

                promise.resolve(
                    createResult(
                        success = true,
                        message = "Allowed apps updated (${packageNames.size} apps)"
                    )
                )
            } catch (e: Exception) {
                promise.reject("SET_APPS_FAILED", "Failed to set allowed apps: ${e.message}", e)
            }
        }

        Function("getAllowedApps") {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val allowedApps = prefs.getStringSet(KEY_ALLOWED_APPS, emptySet()) ?: emptySet()
            return@Function allowedApps.toList()
        }

        Function("isServiceRunning") {
            return@Function if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
                AutoReplyListenerService.isServiceRunning()
            } else {
                false
            }
        }

        AsyncFunction("getActiveNotifications") { promise: Promise ->
            try {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
                    promise.resolve(emptyList<NotificationInfo>())
                    return@AsyncFunction
                }

                if (!AutoReplyListenerService.isServiceRunning()) {
                    promise.resolve(emptyList<NotificationInfo>())
                    return@AsyncFunction
                }

                val notifications = getActiveNotificationsFromService()
                promise.resolve(notifications)
            } catch (e: Exception) {
                promise.reject("GET_NOTIFICATIONS_FAILED", "Failed to get notifications: ${e.message}", e)
            }
        }

        AsyncFunction("sendTestNotification") { senderName: String, message: String, promise: Promise ->
            try {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
                    promise.resolve(
                        createResult(
                            success = false,
                            message = "Test notifications require API 35+"
                        )
                    )
                    return@AsyncFunction
                }

                val notificationId = TestNotificationHelper.createTestNotification(
                    context,
                    senderName,
                    message
                )

                promise.resolve(
                    createResult(
                        success = true,
                        message = "Test notification created (ID: $notificationId)"
                    )
                )
            } catch (e: Exception) {
                promise.reject("SEND_TEST_FAILED", "Failed to send test notification: ${e.message}", e)
            }
        }

        Function("getReplyHistory") {
            return@Function getReplyHistoryFromPrefs()
        }

        AsyncFunction("clearReplyHistory") { promise: Promise ->
            try {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit().putString(KEY_REPLY_HISTORY, "[]").apply()
                promise.resolve(
                    createResult(
                        success = true,
                        message = "Reply history cleared"
                    )
                )
            } catch (e: Exception) {
                promise.reject("CLEAR_HISTORY_FAILED", "Failed to clear history: ${e.message}", e)
            }
        }
    }

    private fun isNotificationListenerEnabled(): Boolean {
        val packageName = context.packageName
        val flat = Settings.Secure.getString(
            context.contentResolver,
            "enabled_notification_listeners"
        )
        if (flat.isNullOrEmpty()) {
            return false
        }
        val names = flat.split(":")
        return names.any { 
            ComponentName.unflattenFromString(it)?.packageName == packageName 
        }
    }

    @RequiresApi(Build.VERSION_CODES.VANILLA_ICE_CREAM)
    private fun getActiveNotificationsFromService(): List<NotificationInfo> {
        return try {
            val service = AutoReplyListenerService::class.java
            val instance = service.getDeclaredField("serviceInstance").get(null) as? AutoReplyListenerService
            
            instance?.getActiveNotificationsList()?.map { sbn ->
                createNotificationInfo(sbn)
            } ?: emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }

    private fun createNotificationInfo(sbn: StatusBarNotification): NotificationInfo {
        val notification = sbn.notification
        val extras = notification.extras

        return NotificationInfo().apply {
            this.packageName = sbn.packageName
            this.title = extras.getCharSequence("android.title")?.toString()
            this.text = extras.getCharSequence("android.text")?.toString()
            this.timestamp = sbn.postTime
            this.hasReplyAction = notification.actions?.any { action ->
                action.remoteInputs?.any { it.allowFreeFormInput } == true
            } ?: false
        }
    }

    private fun createResult(success: Boolean, message: String): AutoReplyResult {
        return AutoReplyResult().apply {
            this.success = success
            this.message = message
        }
    }

    private fun getReplyHistoryFromPrefs(): List<ReplyHistoryItem> {
        return try {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val historyJson = prefs.getString(KEY_REPLY_HISTORY, "[]") ?: "[]"
            val history = org.json.JSONArray(historyJson)
            
            (0 until history.length()).map { i ->
                val item = history.getJSONObject(i)
                ReplyHistoryItem().apply {
                    this.message = item.getString("message")
                    this.timestamp = item.getLong("timestamp")
                }
            }
        } catch (e: Exception) {
            emptyList()
        }
    }
}
