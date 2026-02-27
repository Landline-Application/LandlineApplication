package expo.modules.backgroundservicemanager

import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import androidx.work.*
import java.util.concurrent.TimeUnit

/**
 * WorkManager Worker for battery-efficient periodic background tasks.
 * 
 * Google Play Store Compliance:
 * - WorkManager respects Doze mode and App Standby
 * - System manages task execution to optimize battery
 * - Suitable for deferrable tasks (not urgent/immediate tasks)
 * - Guaranteed execution even if app is killed or device restarts
 */
class BackgroundWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    companion object {
        const val WORK_NAME = "background_service_worker"
        const val KEY_TASK_TYPE = "task_type"
        const val TASK_TYPE_NOTIFICATION_CHECK = "notification_check"
        
        /**
         * Schedule periodic background work
         * Minimum interval is 15 minutes (Android system limitation)
         */
        fun schedulePeriodicWork(
            context: Context,
            intervalMinutes: Long = 15,
            taskType: String = TASK_TYPE_NOTIFICATION_CHECK
        ) {
            val constraints = Constraints.Builder()
                // Only run when device is not in Doze mode
                .setRequiresDeviceIdle(false)
                // Optionally require battery not low
                .setRequiresBatteryNotLow(true)
                // Optionally require network
                // .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            
            val workRequest = PeriodicWorkRequestBuilder<BackgroundWorker>(
                intervalMinutes,
                TimeUnit.MINUTES
            )
                .setConstraints(constraints)
                .setInputData(
                    workDataOf(KEY_TASK_TYPE to taskType)
                )
                .addTag(WORK_NAME)
                .build()
            
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP, // Keep existing work if already scheduled
                workRequest
            )
        }
        
        /**
         * Cancel scheduled background work
         */
        fun cancelWork(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
        
        /**
         * Check if work is currently scheduled
         */
        fun isWorkScheduled(context: Context): Boolean {
            val workInfos = WorkManager.getInstance(context)
                .getWorkInfosForUniqueWork(WORK_NAME)
                .get()
            
            return workInfos.any { 
                it.state == WorkInfo.State.ENQUEUED || it.state == WorkInfo.State.RUNNING 
            }
        }
    }
    
    override suspend fun doWork(): Result {
        return try {
            val taskType = inputData.getString(KEY_TASK_TYPE) ?: TASK_TYPE_NOTIFICATION_CHECK
            
            when (taskType) {
                TASK_TYPE_NOTIFICATION_CHECK -> {
                    performNotificationCheck()
                }
                // Add more task types as needed
                else -> {
                    // Unknown task type
                }
            }
            
            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.failure()
        }
    }
    
    /**
     * Perform notification check and background processing for Landline Mode.
     *
     * This method:
     * 1. Checks if Landline Mode is active.
     * 2. Verifies the NotificationListenerService is still enabled in system settings.
     * 3. Reads current notification log stats from SharedPreferences.
     * 4. Prunes log entries older than MAX_LOG_AGE_MS to prevent unbounded growth.
     * 5. Broadcasts a status update so the foreground service can refresh its notification.
     * 6. Logs a warning if Landline Mode is on but the listener service is not connected.
     */
    private suspend fun performNotificationCheck() {
        val ctx = applicationContext
        val tag = "BackgroundWorker"

        Log.d(tag, "performNotificationCheck() started at ${System.currentTimeMillis()}")

        // ── 1. Check Landline Mode state ─────────────────────────────────────
        val modePrefs = ctx.getSharedPreferences("landline_mode_prefs", Context.MODE_PRIVATE)
        val isLandlineModeActive = modePrefs.getBoolean("is_landline_mode_active", false)
        Log.d(tag, "Landline mode active: $isLandlineModeActive")

        // ── 2. Check if the NotificationListenerService is enabled ────────────
        val enabledListeners = Settings.Secure.getString(
            ctx.contentResolver,
            "enabled_notification_listeners"
        )
        val isListenerEnabled = enabledListeners?.contains(ctx.packageName) == true
        Log.d(tag, "NotificationListenerService enabled: $isListenerEnabled")

        // ── 3. Read notification log stats ────────────────────────────────────
        val notifPrefs = ctx.getSharedPreferences("landline_notifications", Context.MODE_PRIVATE)
        val logsString = notifPrefs.getString("notification_logs", "") ?: ""
        val logCount = if (logsString.isEmpty()) 0
                       else logsString.split("\n").count { it.isNotEmpty() }
        Log.d(tag, "Current notification log count: $logCount")

        // ── 4. Prune logs older than MAX_LOG_AGE_MS (7 days) ─────────────────
        val maxLogAgeMs = 7L * 24 * 60 * 60 * 1000
        val cutoff = System.currentTimeMillis() - maxLogAgeMs
        if (logsString.isNotEmpty()) {
            val filteredLogs = logsString
                .split("\n")
                .filter { line ->
                    if (line.isEmpty()) return@filter false
                    val ts = line.split("|").firstOrNull()?.toLongOrNull() ?: Long.MAX_VALUE
                    ts >= cutoff
                }
                .joinToString("\n")

            if (filteredLogs != logsString) {
                notifPrefs.edit().putString("notification_logs", filteredLogs).apply()
                val remaining = if (filteredLogs.isEmpty()) 0
                                else filteredLogs.split("\n").count { it.isNotEmpty() }
                Log.d(tag, "Pruned stale notification logs. Remaining: $remaining")
            }
        }

        // ── 5. Broadcast status update for the foreground service ─────────────
        if (NotificationForegroundService.isServiceRunning()) {
            val status = when {
                !isLandlineModeActive -> "Landline mode off"
                !isListenerEnabled    -> "Listener permission needed"
                else                  -> "Active — $logCount notification(s) logged"
            }
            val intent = Intent("com.landlineapp.UPDATE_NOTIFICATION").apply {
                putExtra("message", status)
            }
            ctx.sendBroadcast(intent)
            Log.d(tag, "Broadcast status update: $status")
        }

        // ── 6. Warn if Landline Mode is active but listener is not enabled ────
        if (isLandlineModeActive && !isListenerEnabled) {
            Log.w(
                tag,
                "Landline mode is active but NotificationListenerService is NOT enabled. " +
                "User may need to re-grant notification access."
            )
        }

        Log.d(tag, "performNotificationCheck() completed")
    }
}

