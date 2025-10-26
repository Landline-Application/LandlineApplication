package expo.modules.backgroundservicemanager

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Expo Module for managing background services and background tasks.
 * 
 * This module provides:
 * 1. Foreground Service management (for visible background work)
 * 2. WorkManager integration (for battery-efficient periodic tasks)
 * 3. Battery optimization checks and settings
 * 
 * Google Play Store Compliance:
 * - All background work uses proper Android APIs
 * - Respects battery optimization and Doze mode
 * - Provides user-visible notifications for foreground service
 * - Uses WorkManager for deferrable background tasks
 */
class BackgroundServiceManagerModule : Module() {
    
    private val context: Context
        get() = appContext.reactContext ?: throw IllegalStateException("React context is null")
    
    override fun definition() = ModuleDefinition {
        Name("BackgroundServiceManager")
        
        // ============================================================
        // FOREGROUND SERVICE FUNCTIONS
        // ============================================================
        
        /**
         * Start the foreground service with a visible notification
         * Required for any background work that should continue when app is not visible
         */
        Function("startForegroundService") { title: String, message: String ->
            try {
                NotificationForegroundService.startService(context, title, message)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
        
        /**
         * Stop the foreground service
         */
        Function("stopForegroundService") {
            try {
                NotificationForegroundService.stopService(context)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
        
        /**
         * Check if foreground service is currently running
         */
        Function("isForegroundServiceRunning") {
            NotificationForegroundService.isServiceRunning()
        }
        
        // ============================================================
        // WORKMANAGER FUNCTIONS (Battery-Efficient Background Tasks)
        // ============================================================
        
        /**
         * Schedule periodic background work using WorkManager
         * Minimum interval is 15 minutes (Android system requirement)
         * 
         * @param intervalMinutes How often to run the task (minimum 15)
         * @param taskType Type of task to perform
         */
        Function("scheduleBackgroundWork") { intervalMinutes: Int, taskType: String ->
            try {
                val interval = if (intervalMinutes < 15) 15 else intervalMinutes.toLong()
                BackgroundWorker.schedulePeriodicWork(context, interval, taskType)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
        
        /**
         * Cancel scheduled background work
         */
        Function("cancelBackgroundWork") {
            try {
                BackgroundWorker.cancelWork(context)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
        
        /**
         * Check if background work is currently scheduled
         */
        Function("isBackgroundWorkScheduled") {
            try {
                BackgroundWorker.isWorkScheduled(context)
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
        
        // ============================================================
        // BATTERY OPTIMIZATION FUNCTIONS
        // ============================================================
        
        /**
         * Check if the app is ignoring battery optimizations
         * When true, app can run more freely in background (use responsibly!)
         */
        Function("isIgnoringBatteryOptimizations") {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                powerManager.isIgnoringBatteryOptimizations(context.packageName)
            } else {
                true // Not applicable on older Android versions
            }
        }
        
        /**
         * Request user to disable battery optimizations for this app
         * WARNING: Only use if absolutely necessary for your app's core functionality
         * Google Play may reject apps that abuse this
         */
        AsyncFunction("requestIgnoreBatteryOptimizations") {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:${context.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    true
                } else {
                    true // Not needed on older versions
                }
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
        
        /**
         * Open battery optimization settings for the app
         * Less aggressive than requesting to ignore optimizations
         */
        AsyncFunction("openBatteryOptimizationSettings") {
            try {
                val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                } else {
                    Intent(Settings.ACTION_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                }
                context.startActivity(intent)
                true
            } catch (e: Exception) {
                e.printStackTrace()
                false
            }
        }
        
        // ============================================================
        // UTILITY FUNCTIONS
        // ============================================================
        
        /**
         * Get Android version info (useful for conditional behavior)
         */
        Function("getAndroidVersion") {
            mapOf(
                "sdkInt" to Build.VERSION.SDK_INT,
                "release" to Build.VERSION.RELEASE,
                "codename" to Build.VERSION.CODENAME
            )
        }
        
        /**
         * Check if device is in Doze mode
         * In Doze mode, background work is heavily restricted
         */
        Function("isDeviceIdleMode") {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
                powerManager.isDeviceIdleMode
            } else {
                false
            }
        }
    }
}

