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
import java.net.URL

class NotificationApiManagerModule : Module() {
    override fun definition() = ModuleDefinition {
        // JS name: requireNativeModule('NotificationApiManager')
        Name("NotificationApiManager")

        // Quick smoke test
        Function("hello") {
            "Hello from NotificationApiManager!"
        }

        // Same module name as iOS — registers the native view for requireNativeView('NotificationApiManager').
        View(NotificationApiManagerView::class) {
            Events("onLoad")

            Prop("url") { view: NotificationApiManagerView, url: URL? ->
                if (url != null) {
                    view.webView.loadUrl(url.toString())
                }
            }
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
                    val channel = NotificationChannel(id, name, importance).apply {
                        lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
                    }
                    nm.createNotificationChannel(channel)
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
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)

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

        // --- Notification whitelist (Landline Mode): allowed apps + emergency phone digits ---

        Function("isNotificationFilterEnabled") {
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.getBoolean("notification_filter_enabled", false)
        }

        Function("setNotificationFilterEnabled") { enabled: Boolean ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("notification_filter_enabled", enabled).apply()
            true
        }

        Function("getAllowedNotificationPackages") {
            val ctx = appContext.reactContext ?: return@Function emptyList<String>()
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            val set = prefs.getStringSet("allowed_notification_packages", emptySet()) ?: emptySet()
            set.toList().sorted()
        }

        Function("setAllowedNotificationPackages") { packageNames: List<String> ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.edit().putStringSet("allowed_notification_packages", packageNames.toSet()).apply()
            true
        }

        Function("getEmergencyPhoneNumbers") {
            val ctx = appContext.reactContext ?: return@Function emptyList<String>()
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            val set = prefs.getStringSet("emergency_phone_digits", emptySet()) ?: emptySet()
            set.toList().sorted()
        }

        Function("setEmergencyPhoneNumbers") { phoneNumbers: List<String> ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            val normalized = phoneNumbers
                .map { digits -> digits.filter { it.isDigit() } }
                .filter { it.length >= 7 }
                .toSet()
            prefs.edit().putStringSet("emergency_phone_digits", normalized).apply()
            true
        }

        Function("isNotificationFilterConfigured") {
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            val packages = prefs.getStringSet("allowed_notification_packages", emptySet()) ?: emptySet()
            val emergency = prefs.getStringSet("emergency_phone_digits", emptySet()) ?: emptySet()
            packages.isNotEmpty() || emergency.isNotEmpty()
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

        // ============================================================
        // EMERGENCY CONTACTS (JSON array; supports multiple)
        // ============================================================

        Function("setEmergencyContactsJson") { json: String ->
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("emergency_contacts_json", json)
                .remove("emergency_contact_name")
                .remove("emergency_contact_phone")
                .apply()
            true
        }

        Function("getEmergencyContactsJson") {
            val ctx = appContext.reactContext ?: return@Function "[]"
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            val json = prefs.getString("emergency_contacts_json", null)
            if (!json.isNullOrBlank()) return@Function json
            val name = prefs.getString("emergency_contact_name", null) ?: ""
            val phone = prefs.getString("emergency_contact_phone", null)
            if (!phone.isNullOrEmpty()) {
                val arr = org.json.JSONArray()
                val o = org.json.JSONObject()
                o.put("name", name)
                o.put("phone", phone)
                arr.put(o)
                return@Function arr.toString()
            }
            "[]"
        }

        /** Legacy: replaces list with a single contact */
        Function("setEmergencyContact") { name: String, phone: String ->
            val ctx = appContext.reactContext ?: return@Function false
            val arr = org.json.JSONArray()
            val o = org.json.JSONObject()
            o.put("name", name)
            o.put("phone", phone)
            arr.put(o)
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("emergency_contacts_json", arr.toString())
                .remove("emergency_contact_name")
                .remove("emergency_contact_phone")
                .apply()
            true
        }

        /** Legacy: first contact if any */
        Function("getEmergencyContact") {
            val ctx = appContext.reactContext ?: return@Function mapOf<String, String?>()
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            val json = prefs.getString("emergency_contacts_json", null)
            if (!json.isNullOrBlank()) {
                try {
                    val arr = org.json.JSONArray(json)
                    if (arr.length() > 0) {
                        val o = arr.getJSONObject(0)
                        return@Function mapOf(
                            "name" to if (o.has("name")) o.getString("name") else null,
                            "phone" to if (o.has("phone")) o.getString("phone") else null
                        )
                    }
                } catch (_: Exception) { }
            }
            mapOf(
                "name" to prefs.getString("emergency_contact_name", null),
                "phone" to prefs.getString("emergency_contact_phone", null)
            )
        }

        Function("clearEmergencyContact") {
            val ctx = appContext.reactContext ?: return@Function false
            val prefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("emergency_contacts_json", "[]")
                .remove("emergency_contact_name")
                .remove("emergency_contact_phone")
                .apply()
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
            val serviceInstance = LandlineNotificationListenerService.getInstance()
            
            val notifications = serviceInstance?.getActiveNotificationsList() ?: emptyArray()
            
            notifications.map { sbn ->
                val notification = sbn.notification
                
                mapOf(
                    "packageName" to sbn.packageName,
                    "title" to LandlineNotificationListenerService.extractNotificationTitle(notification),
                    "text" to LandlineNotificationListenerService.extractNotificationText(notification),
                    "timestamp" to sbn.postTime,
                    "hasReplyAction" to (notification.actions?.any { action ->
                        action.remoteInputs?.any { it.allowFreeFormInput } == true
                    } ?: false)
                )
            }
        }
    }
}
