package expo.modules.backgroundservicemanager

import android.content.Context
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
     * Perform notification check or other background operations
     * This is where you implement your actual background logic
     */
    private suspend fun performNotificationCheck() {
        // TODO: Implement your notification checking logic here
        // This could involve:
        // - Checking for new notifications
        // - Processing notification data
        // - Updating local database
        // - Triggering local notifications if needed
        
        // Example: Log that work was performed
        android.util.Log.d("BackgroundWorker", "Performing notification check at ${System.currentTimeMillis()}")
        
        // If the foreground service is running, you could update its notification
        // to show that background work was performed
    }
}

