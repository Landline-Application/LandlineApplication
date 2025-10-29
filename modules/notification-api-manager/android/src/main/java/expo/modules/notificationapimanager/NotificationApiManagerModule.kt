package expo.modules.notificationapimanager

import android.Manifest
import android.annotation.SuppressLint
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
                
                true
            } catch (e: Exception) {
                android.util.Log.e("NotificationApiManager", "Error clearing all data: ${e.message}", e)
                false
            }
        }
    }
}