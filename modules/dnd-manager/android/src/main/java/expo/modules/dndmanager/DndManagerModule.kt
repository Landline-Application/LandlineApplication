package expo.modules.dndmanager

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

class DndManagerModule : Module() {
    
    override fun definition() = ModuleDefinition {
        Name("DndManager")

        Events("onDNDStatusChanged")

        AsyncFunction("getDNDStatus") { promise: Promise ->
            try {
                val context = appContext.reactContext ?: throw Exception("React context not available")
                val status = getCurrentDNDStatus(context)
                promise.resolve(status)
            } catch (e: Exception) {
                promise.reject("DND_STATUS_ERROR", "Failed to get DND status: ${e.message}", e)
            }
        }

        AsyncFunction("getDNDSettings") { promise: Promise ->
            try {
                val context = appContext.reactContext ?: throw Exception("React context not available")
                val settings = getDNDCapabilities(context)
                promise.resolve(settings)
            } catch (e: Exception) {
                promise.reject("DND_SETTINGS_ERROR", "Failed to get DND settings: ${e.message}", e)
            }
        }

        AsyncFunction("openDNDSettings") { promise: Promise ->
            try {
                val context = appContext.reactContext ?: throw Exception("React context not available")
                val intent = Intent("android.settings.ZEN_MODE_SETTINGS")
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("OPEN_SETTINGS_ERROR", "Failed to open DND settings: ${e.message}", e)
            }
        }

        AsyncFunction("requestDNDPermissions") { promise: Promise ->
            try {
                val context = appContext.reactContext ?: throw Exception("React context not available")
                val intent = Intent("android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS")
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("PERMISSION_ERROR", "Failed to request DND permission: ${e.message}", e)
            }
        }
    }

    private fun getCurrentDNDStatus(context: Context): Map<String, Any> {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val currentFilter = notificationManager.currentInterruptionFilter
        
        val mode = when (currentFilter) {
            NotificationManager.INTERRUPTION_FILTER_NONE -> "none"
            NotificationManager.INTERRUPTION_FILTER_PRIORITY -> "priority"
            NotificationManager.INTERRUPTION_FILTER_ALARMS -> "alarms"
            NotificationManager.INTERRUPTION_FILTER_ALL -> "all"
            else -> "unknown"
        }

        return mapOf(
            "isActive" to (currentFilter != NotificationManager.INTERRUPTION_FILTER_ALL),
            "mode" to mode,
            "filter" to currentFilter,
            "canControl" to notificationManager.isNotificationPolicyAccessGranted
        )
    }

    private fun getDNDCapabilities(context: Context): Map<String, Any> {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        return mapOf(
            "hasPermission" to notificationManager.isNotificationPolicyAccessGranted,
            "canAccessSettings" to true,
            "supportedFeatures" to listOf("status_check", "settings_access", "permission_request")
        )
    }
}