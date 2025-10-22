package expo.modules.backgroundservicemanager

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat

/**
 * Foreground Service for handling background operations while the app is not visible.
 * This service displays a persistent notification to the user (required by Android).
 * 
 * Google Play Store Compliance:
 * - Uses FOREGROUND_SERVICE permission
 * - Shows persistent notification to user
 * - Properly handles lifecycle to prevent battery drain
 * - Respects Doze mode and App Standby
 */
class NotificationForegroundService : Service() {
    
    companion object {
        const val CHANNEL_ID = "background_service_channel"
        const val NOTIFICATION_ID = 1001
        const val ACTION_START_SERVICE = "ACTION_START_SERVICE"
        const val ACTION_STOP_SERVICE = "ACTION_STOP_SERVICE"
        
        private var isRunning = false
        
        fun isServiceRunning(): Boolean = isRunning
        
        fun startService(context: Context, title: String, message: String) {
            val intent = Intent(context, NotificationForegroundService::class.java).apply {
                action = ACTION_START_SERVICE
                putExtra("title", title)
                putExtra("message", message)
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
        
        fun stopService(context: Context) {
            val intent = Intent(context, NotificationForegroundService::class.java).apply {
                action = ACTION_STOP_SERVICE
            }
            context.startService(intent)
        }
    }
    
    private var wakeLock: PowerManager.WakeLock? = null
    
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_SERVICE -> {
                val title = intent.getStringExtra("title") ?: "Background Service"
                val message = intent.getStringExtra("message") ?: "Service is running"
                
                startForeground(NOTIFICATION_ID, createNotification(title, message))
                isRunning = true
                
                // Optional: Acquire wake lock if absolutely necessary
                // Use sparingly to preserve battery life
                // acquireWakeLock()
            }
            ACTION_STOP_SERVICE -> {
                stopForegroundService()
            }
        }
        
        // START_STICKY ensures service restarts if killed by system
        // Use START_NOT_STICKY if you don't need auto-restart
        return START_STICKY
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        releaseWakeLock()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Background Service",
                NotificationManager.IMPORTANCE_LOW // LOW importance = no sound/vibration
            ).apply {
                description = "Notification for background service operations"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    private fun createNotification(title: String, message: String): Notification {
        // Create intent to open app when notification is tapped
        val notificationIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        
        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(android.R.drawable.ic_dialog_info) // Replace with your app icon
            .setContentIntent(pendingIntent)
            .setOngoing(true) // Makes notification persistent
            .setPriority(NotificationCompat.PRIORITY_LOW) // Low priority = less intrusive
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            builder.setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
        }
        
        return builder.build()
    }
    
    /**
     * Update the foreground notification with new content
     */
    fun updateNotification(title: String, message: String) {
        val notification = createNotification(title, message)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
    
    private fun stopForegroundService() {
        releaseWakeLock()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        isRunning = false
    }
    
    /**
     * Acquire wake lock - USE SPARINGLY!
     * Only use if you absolutely need to keep CPU running
     * This will drain battery significantly
     */
    private fun acquireWakeLock() {
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "BackgroundService::WakeLock"
            ).apply {
                acquire(10 * 60 * 1000L) // 10 minutes timeout for safety
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
    
    private fun releaseWakeLock() {
        try {
            wakeLock?.let {
                if (it.isHeld) {
                    it.release()
                }
            }
            wakeLock = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

