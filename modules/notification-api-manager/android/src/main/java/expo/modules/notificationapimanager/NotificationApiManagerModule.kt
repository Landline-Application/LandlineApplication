package expo.modules.notificationapimanager

import android.Manifest
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationApiManagerModule : Module() {
    override fun definition() = ModuleDefinition {
        // JS name: requireNativeModule('NotificationApiManager')
        Name("NotificationApiManager")

        // Quick smoke test
        Function("hello") {
            "Hello from NotificationApiManager!"
        }

        // Android 13+ runtime notification permission (older versions don't require it)
        Function("hasPostPermission") {
            val ctx = appContext.reactContext ?: return@Function false
            if (Build.VERSION.SDK_INT < 33) {
                true
            } else {
                ContextCompat.checkSelfPermission(
                    ctx,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            }
        }

        // Opens the app's system notification settings. Returns true if we could launch it.
        AsyncFunction("requestPostPermission") {
            val ctx = appContext.reactContext ?: return@AsyncFunction false
            if (Build.VERSION.SDK_INT < 33) return@AsyncFunction true

            ctx.startActivity(
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
            true
        }

        // Create/update a notification channel (Android O+). Returns true if OK.
        Function("createChannel") { id: String, name: String, importance: Int ->
            val ctx = appContext.reactContext ?: return@Function false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (nm.getNotificationChannel(id) == null) {
                    nm.createNotificationChannel(NotificationChannel(id, name, importance))
                }
            }
            true
        }

        // Post a notification. Returns true if it was posted (or not needed pre-33).
        @SuppressLint("MissingPermission")
        Function("notify") { title: String, body: String, channelId: String, notificationId: Int ->
            val ctx = appContext.reactContext ?: return@Function false

            // Respect Android 13+ permission
            if (Build.VERSION.SDK_INT >= 33) {
                val granted = ContextCompat.checkSelfPermission(
                    ctx, Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
                if (!granted) return@Function false
            }

            val builder = NotificationCompat.Builder(ctx, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // replace with app icon later
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)

            NotificationManagerCompat.from(ctx).notify(notificationId, builder.build())
            true
        }

        // ============================================================
        // NOTIFICATION LISTENER SERVICE (for Landline Mode)
        // ============================================================

        /**
         * Check if Notification Listener permission is granted
         * This is required to capture notifications during Landline mode
         */
        Function("hasNotificationListenerPermission") {
            val ctx = appContext.reactContext ?: return@Function false
            val enabledListeners = Settings.Secure.getString(
                ctx.contentResolver,
                "enabled_notification_listeners"
            )
            val packageName = ctx.packageName
            enabledListeners != null && enabledListeners.contains(packageName)
        }

        /**
         * Open Notification Access settings to grant permission
         */
        AsyncFunction("requestNotificationListenerPermission") {
            val ctx = appContext.reactContext ?: return@AsyncFunction false
            try {
                val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                ctx.startActivity(intent)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }

        /**
         * Set Landline mode active/inactive
         * When active, notifications will be logged by the NotificationListenerService
         */
        Function("setLandlineMode") { isActive: Boolean ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("is_landline_mode_active", isActive).apply()
            true
        }

        /**
         * Check if Landline mode is currently active
         */
        Function("isLandlineModeActive") {
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.getBoolean("is_landline_mode_active", false)
        }

        /**
         * Get all logged notifications
         * Returns array of notification objects
         */
        Function("getLoggedNotifications") {
            val ctx = appContext.reactContext ?: return@Function emptyList<Map<String, Any?>>()
            val prefs = ctx.getSharedPreferences("landline_notifications", Context.MODE_PRIVATE)
            val logsString = prefs.getString("notification_logs", "") ?: ""
            
            if (logsString.isEmpty()) {
                return@Function emptyList<Map<String, Any?>>()
            }

            // Parse the log entries
            val notifications = mutableListOf<Map<String, Any?>>()
            val lines = logsString.split("\n")
            
            for (line in lines) {
                if (line.isEmpty()) continue
                
                val parts = line.split("|")
                if (parts.size >= 7) {
                    val notification = mapOf<String, Any?>(
                        "timestamp" to (parts[0].toLongOrNull() as Any?),
                        "packageName" to (parts[1] as Any),
                        "appName" to (parts[2] as Any),
                        "title" to (parts[3] as Any),
                        "text" to (parts[4] as Any),
                        "postTime" to (parts[5].toLongOrNull() as Any?),
                        "id" to (parts[6].toIntOrNull() as Any?)
                    )
                    notifications.add(notification)
                }
            }
            
            // Return most recent first
            notifications.reversed()
        }

        /**
         * Remove a single logged notification by its timestamp (unique log capture time)
         * Returns true if the notification was found and removed
         */
        Function("removeLoggedNotification") { timestamp: Double ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_notifications", Context.MODE_PRIVATE)
            val logsString = prefs.getString("notification_logs", "") ?: ""
            if (logsString.isEmpty()) return@Function false

            val targetTs = timestamp.toLong().toString()
            val lines = logsString.split("\n").filter { line ->
                if (line.isEmpty()) true
                else {
                    val parts = line.split("|")
                    parts.isNotEmpty() && parts[0] != targetTs
                }
            }
            val updatedLogs = lines.filter { it.isNotEmpty() }.joinToString("\n")
            prefs.edit().putString("notification_logs", updatedLogs).apply()
            true
        }

        /**
         * Remove multiple logged notifications by their timestamps
         * Returns true if at least one was found and removed
         */
        Function("removeLoggedNotifications") { timestamps: List<Double> ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_notifications", Context.MODE_PRIVATE)
            val logsString = prefs.getString("notification_logs", "") ?: ""
            if (logsString.isEmpty()) return@Function false

            val targetSet = timestamps.map { it.toLong().toString() }.toSet()
            val lines = logsString.split("\n").filter { line ->
                if (line.isEmpty()) true
                else {
                    val parts = line.split("|")
                    parts.isEmpty() || parts[0] !in targetSet
                }
            }
            val updatedLogs = lines.filter { it.isNotEmpty() }.joinToString("\n")
            prefs.edit().putString("notification_logs", updatedLogs).apply()
            true
        }

        /**
         * Add random test notifications for development/testing
         * Appends to existing log without overwriting
         */
        Function("addTestNotifications") { count: Int ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_notifications", Context.MODE_PRIVATE)
            val existingLogs = prefs.getString("notification_logs", "") ?: ""

            val apps = listOf(
                "Messages" to "com.android.messaging",
                "Gmail" to "com.google.android.gm",
                "Slack" to "com.Slack",
                "WhatsApp" to "com.whatsapp",
                "Instagram" to "com.instagram.android",
                "Twitter" to "com.twitter.android",
                "Calendar" to "com.google.android.calendar",
                "Chrome" to "com.android.chrome",
                "Phone" to "com.android.dialer",
                "Landline" to "com.landline.app",
            )
            val titles = listOf(
                "New message", "Meeting reminder", "You have a new follower",
                "Package delivered", "Low battery", "Weather alert",
                "Backup complete", "Update available", "Missed call",
                "Voicemail", "Test notification", "Landline Mode Active",
            )
            val texts = listOf(
                "Check this out!", "Don't forget your meeting at 3pm",
                "Your package has been delivered", "Battery is below 15%",
                "Rain expected tomorrow", "Your data has been backed up",
                "A new version is available", "You have a new voicemail",
                "Your notifications are being captured", "Debug notification",
            )

            val entries = mutableListOf<String>()
            val now = System.currentTimeMillis()
            for (i in 0 until count.coerceIn(1, 50)) {
                val (appName, pkg) = apps.random()
                val title = titles.random()
                val text = texts.random()
                val postTime = now - (i * 60000L)
                val ts = now + (i * 1000L)
                entries.add("$ts|$pkg|$appName|$title|$text|$postTime|$i")
            }
            val newLogs = if (existingLogs.isEmpty()) entries.joinToString("\n")
            else "$existingLogs\n${entries.joinToString("\n")}"
            prefs.edit().putString("notification_logs", newLogs).apply()
            true
        }

        /**
         * Clear all logged notifications
         */
        Function("clearLoggedNotifications") {
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_notifications", Context.MODE_PRIVATE)
            prefs.edit().remove("notification_logs").apply()
            true
        }

        /**
         * Clear ALL user data stored in native storage
         * This includes:
         * - Landline mode state (landline_mode_prefs)
         * - All notification logs (landline_notifications)
         * - Auto-reply preferences
         * 
         * Used for data deletion functionality
         */
        AsyncFunction("clearAllData") {
            val ctx = appContext.reactContext ?: return@AsyncFunction false
            
            try {
                // Clear Landline mode preferences
                val modePrefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
                modePrefs.edit().clear().apply()
                
                // Clear notification logs
                val notifPrefs = ctx.getSharedPreferences("landline_notifications", Context.MODE_PRIVATE)
                notifPrefs.edit().clear().apply()
                
                // Clear auto-reply preferences
                val autoReplyPrefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
                autoReplyPrefs.edit().clear().apply()
                
                true
            } catch (e: Exception) {
                android.util.Log.e("NotificationApiManager", "Error clearing all data: ${e.message}", e)
                false
            }
        }

        // ============================================================
        // AUTO-REPLY FUNCTIONALITY
        // ============================================================

        /**
         * Check if auto-reply is currently enabled
         */
        Function("isAutoReplyEnabled") {
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            prefs.getBoolean("auto_reply_enabled", false)
        }

        /**
         * Enable or disable auto-reply
         */
        Function("setAutoReplyEnabled") { enabled: Boolean ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("auto_reply_enabled", enabled).apply()
            true
        }

        /**
         * Set the default auto-reply message
         */
        Function("setReplyMessage") { message: String ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("default_reply_message", message).apply()
            true
        }

        /**
         * Get the current auto-reply message
         */
        Function("getReplyMessage") {
            val ctx = appContext.reactContext ?: return@Function "Auto-reply: I'll get back to you soon."
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            prefs.getString("default_reply_message", "Auto-reply: I'll get back to you soon.") 
                ?: "Auto-reply: I'll get back to you soon."
        }

        /**
         * Set which apps are allowed for auto-reply
         * Pass empty list to allow all apps
         */
        Function("setAllowedApps") { packageNames: List<String> ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            prefs.edit().putStringSet("allowed_apps", packageNames.toSet()).apply()
            true
        }

        /**
         * Get list of apps allowed for auto-reply
         */
        Function("getAllowedApps") {
            val ctx = appContext.reactContext ?: return@Function emptyList<String>()
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            val allowedApps = prefs.getStringSet("allowed_apps", emptySet()) ?: emptySet()
            allowedApps.toList()
        }

        /**
         * Get auto-reply history
         */
        Function("getReplyHistory") {
            val ctx = appContext.reactContext ?: return@Function emptyList<Map<String, Any?>>()
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            val historyJson = prefs.getString("reply_history", "[]") ?: "[]"
            
            try {
                val history = org.json.JSONArray(historyJson)
                val result = mutableListOf<Map<String, Any?>>()
                
                for (i in 0 until history.length()) {
                    val item = history.getJSONObject(i)
                    result.add(mapOf(
                        "message" to item.getString("message"),
                        "timestamp" to item.getLong("timestamp")
                    ))
                }
                
                result
            } catch (e: Exception) {
                android.util.Log.e("NotificationApiManager", "Error parsing reply history: ${e.message}", e)
                emptyList<Map<String, Any?>>()
            }
        }

        /**
         * Clear auto-reply history
         */
        Function("clearReplyHistory") {
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("auto_reply_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("reply_history", "[]").apply()
            true
        }

        /**
         * Check if the unified service is running
         */
        Function("isServiceRunning") {
            LandlineNotificationListenerService.isServiceRunning()
        }

        /**
         * Get list of active notifications (from the listener service)
         */
        Function("getActiveNotifications") {
            val serviceInstance = LandlineNotificationListenerService::class.java
                .getDeclaredField("serviceInstance")
                .get(null) as? LandlineNotificationListenerService
            
            val notifications = serviceInstance?.getActiveNotificationsList() ?: emptyArray()
            
            notifications.map { sbn ->
                val notification = sbn.notification
                val extras = notification.extras
                
                mapOf(
                    "packageName" to sbn.packageName,
                    "title" to extras?.getCharSequence(Notification.EXTRA_TITLE)?.toString(),
                    "text" to extras?.getCharSequence(Notification.EXTRA_TEXT)?.toString(),
                    "timestamp" to sbn.postTime,
                    "hasReplyAction" to (notification.actions?.any { action ->
                        action.remoteInputs?.any { it.allowFreeFormInput } == true
                    } ?: false)
                )
            }
        }
    }
}