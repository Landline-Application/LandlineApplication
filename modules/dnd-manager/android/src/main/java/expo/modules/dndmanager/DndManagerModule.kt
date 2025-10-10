package expo.modules.dndmanager

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record


class DNDResult : Record {
    @Field
    var success: Boolean = false

    @Field
    var message: String = ""

    @Field
    var currentState: Int? = null

    @Field
    var ruleId: String? = null
}

class AppInfo : Record {
    @Field
    var packageName: String = ""

    @Field
    var appName: String = ""

    @Field
    var notificationsEnabled: Boolean = false

    @Field
    var isSystemApp: Boolean = false
}

class NotificationPermissionResult : Record {
    @Field
    var success: Boolean = false

    @Field
    var message: String = ""

    @Field
    var notificationsEnabled: Boolean? = null
}

class DndManagerModule : Module() {
    private val context: Context
        get() = requireNotNull(appContext.reactContext)

    private val notificationManager: NotificationManager
        get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private val packageManager: PackageManager
        get() = context.packageManager

    companion object {
        private const val TAG = "DNDController"
    }

    override fun definition() = ModuleDefinition {
        Name("DndManager")

        Events("onDNDStatusChanged")

        Function("hasPermission") {
            return@Function notificationManager.isNotificationPolicyAccessGranted
        }

        AsyncFunction("requestPermission") { promise: Promise ->
            try {
                if (notificationManager.isNotificationPolicyAccessGranted) {
                    promise.resolve(true)
                    return@AsyncFunction
                }

                val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)

                promise.resolve(false)
            } catch (e: Exception) {
                promise.reject("PERMISSION_REQUEST_FAILED", "Failed to open permission settings", e)
            }
        }

        Function("getCurrentState") {
            return@Function createDNDResult(
                success = true,
                message = getDNDStateName(notificationManager.currentInterruptionFilter),
                currentState = notificationManager.currentInterruptionFilter
            )
        }

        AsyncFunction("setInterruptionFilter") { filter: Int, promise: Promise ->
            try {
                if (!notificationManager.isNotificationPolicyAccessGranted) {
                    promise.resolve(
                        createDNDResult(
                            success = false,
                            message = "Permission not granted"
                        )
                    )
                    return@AsyncFunction
                }

                if (!isValidInterruptionFilter(filter)) {
                    promise.resolve(
                        createDNDResult(
                            success = false,
                            message = "Invalid interruption filter value"
                        )
                    )
                    return@AsyncFunction
                }

                notificationManager.setInterruptionFilter(filter)

                promise.resolve(
                    createDNDResult(
                        success = true,
                        message = "Interruption filter set to ${getDNDStateName(filter)}",
                        currentState = notificationManager.currentInterruptionFilter
                    )
                )
            } catch (e: SecurityException) {
                promise.resolve(
                    createDNDResult(
                        success = false,
                        message = "Permission denied: ${e.message}"
                    )
                )
            } catch (e: Exception) {
                promise.reject("SET_FILTER_FAILED", "Failed to set interruption filter: ${e.message}", e)
            }
        }

        AsyncFunction("setDNDEnabled") { enabled: Boolean, promise: Promise ->
            try {
                if (!notificationManager.isNotificationPolicyAccessGranted) {
                    promise.resolve(
                        createDNDResult(
                            success = false,
                            message = "Permission not granted"
                        )
                    )
                    return@AsyncFunction
                }

                val filter = if (enabled) {
                    NotificationManager.INTERRUPTION_FILTER_NONE
                } else {
                    NotificationManager.INTERRUPTION_FILTER_ALL
                }

                notificationManager.setInterruptionFilter(filter)

                promise.resolve(
                    createDNDResult(
                        success = true,
                        message = if (enabled) "DND enabled" else "DND disabled",
                        currentState = notificationManager.currentInterruptionFilter
                    )
                )
            } catch (e: SecurityException) {
                promise.resolve(
                    createDNDResult(
                        success = false,
                        message = "Permission denied: ${e.message}"
                    )
                )
            } catch (e: Exception) {
                promise.reject("SET_DND_FAILED", "Failed to set DND: ${e.message}", e)
            }
        }

        AsyncFunction("getAllInstalledApps") { includeSystemApps: Boolean, promise: Promise ->
            try {
                val apps = getInstalledApps(includeSystemApps)
                promise.resolve(apps)
            } catch (e: Exception) {
                promise.reject("GET_APPS_FAILED", "Failed to get installed apps: ${e.message}", e)
            }
        }

        AsyncFunction("getAppNotificationStatus") { packageName: String, promise: Promise ->
            try {
                val enabled = areNotificationsEnabled(packageName)
                promise.resolve(
                    createNotificationPermissionResult(
                        success = true,
                        message = "Notifications ${if (enabled) "enabled" else "disabled"}",
                        notificationsEnabled = enabled
                    )
                )
            } catch (e: PackageManager.NameNotFoundException) {
                promise.resolve(
                    createNotificationPermissionResult(
                        success = false,
                        message = "Package not found: $packageName"
                    )
                )
            } catch (e: Exception) {
                promise.reject("GET_STATUS_FAILED", "Failed to get notification status: ${e.message}", e)
            }
        }

        AsyncFunction("openAppNotificationSettings") { packageName: String, promise: Promise ->
            try {
                val intent = Intent().apply {
                    when {
                        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O -> {
                            action = Settings.ACTION_APP_NOTIFICATION_SETTINGS
                            putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                        }
                        else -> {
                            action = Settings.ACTION_APPLICATION_DETAILS_SETTINGS
                            data = android.net.Uri.fromParts("package", packageName, null)
                        }
                    }
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }

                context.startActivity(intent)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("OPEN_SETTINGS_FAILED", "Failed to open notification settings: ${e.message}", e)
            }
        }

        Function("getInterruptionFilterConstants") {
            return@Function mapOf(
                "ALL" to NotificationManager.INTERRUPTION_FILTER_ALL,
                "PRIORITY" to NotificationManager.INTERRUPTION_FILTER_PRIORITY,
                "NONE" to NotificationManager.INTERRUPTION_FILTER_NONE,
                "ALARMS" to NotificationManager.INTERRUPTION_FILTER_ALARMS,
                "UNKNOWN" to NotificationManager.INTERRUPTION_FILTER_UNKNOWN
            )
        }
    }


    private fun createDNDResult(
        success: Boolean,
        message: String,
        currentState: Int? = null,
        ruleId: String? = null
    ): DNDResult {
        return DNDResult().apply {
            this.success = success
            this.message = message
            this.currentState = currentState
            this.ruleId = ruleId
        }
    }

    private fun createNotificationPermissionResult(
        success: Boolean,
        message: String,
        notificationsEnabled: Boolean? = null
    ): NotificationPermissionResult {
        return NotificationPermissionResult().apply {
            this.success = success
            this.message = message
            this.notificationsEnabled = notificationsEnabled
        }
    }

    private fun getDNDStateName(filter: Int): String {
        return when (filter) {
            NotificationManager.INTERRUPTION_FILTER_NONE -> "Total Silence"
            NotificationManager.INTERRUPTION_FILTER_PRIORITY -> "Priority Only"
            NotificationManager.INTERRUPTION_FILTER_ALARMS -> "Alarms Only"
            NotificationManager.INTERRUPTION_FILTER_ALL -> "Normal"
            else -> "Unknown"
        }
    }

    private fun isValidInterruptionFilter(filter: Int): Boolean {
        return filter in setOf(
            NotificationManager.INTERRUPTION_FILTER_ALL,
            NotificationManager.INTERRUPTION_FILTER_PRIORITY,
            NotificationManager.INTERRUPTION_FILTER_ALARMS,
            NotificationManager.INTERRUPTION_FILTER_NONE
        )
    }

    private fun getInstalledApps(includeSystemApps: Boolean): List<AppInfo> {
        val installedApps = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.getInstalledApplications(
                PackageManager.ApplicationInfoFlags.of(PackageManager.GET_META_DATA.toLong())
            )
        } else {
            @Suppress("DEPRECATION")
            packageManager.getInstalledApplications(PackageManager.GET_META_DATA)
        }

        return installedApps
            .filter { appInfo ->
                val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                includeSystemApps || !isSystemApp
            }
            .mapNotNull { appInfo ->
                try {
                    createAppInfo(appInfo)
                } catch (e: Exception) {
                    null
                }
            }
            .sortedBy { it.appName.lowercase() }
    }

    private fun createAppInfo(appInfo: ApplicationInfo): AppInfo {
        val isSystemApp = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
        val notificationsEnabled = areNotificationsEnabled(appInfo.packageName)

        return AppInfo().apply {
            this.packageName = appInfo.packageName
            this.appName = appInfo.loadLabel(packageManager).toString()
            this.notificationsEnabled = notificationsEnabled
            this.isSystemApp = isSystemApp
        }
    }

    private fun areNotificationsEnabled(packageName: String): Boolean {
        return try {
            if (packageName == context.packageName) {
                NotificationManagerCompat.from(context).areNotificationsEnabled()
            } else {
                val appInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    packageManager.getApplicationInfo(
                        packageName,
                        PackageManager.ApplicationInfoFlags.of(0)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    packageManager.getApplicationInfo(packageName, 0)
                }
                val uid = appInfo.uid
                
                try {
                    val method = notificationManager.javaClass.getDeclaredMethod(
                        "areNotificationsEnabledForPackage",
                        String::class.java,
                        Int::class.javaPrimitiveType
                    )
                    method.isAccessible = true
                    method.invoke(notificationManager, packageName, uid) as Boolean
                } catch (e: Exception) {
                    true
                }
            }
        } catch (e: Exception) {
            false
        }
    }
}