package expo.modules.autoreplymanager

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import androidx.core.app.Person
import androidx.core.app.RemoteInput

@RequiresApi(Build.VERSION_CODES.VANILLA_ICE_CREAM)
object TestNotificationHelper {
    private const val CHANNEL_ID = "test_messages"
    private const val CHANNEL_NAME = "Test Messages"
    private const val KEY_TEXT_REPLY = "key_text_reply"
    private const val LOG_PREFS_NAME = "landline_notifications"
    private const val LOG_KEY = "notification_logs"
    
    fun createTestNotification(context: Context, senderName: String, message: String): Int {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        
        createNotificationChannel(context, notificationManager)
        
        val notificationId = System.currentTimeMillis().toInt()
        
        val replyIntent = Intent(context, ReplyReceiver::class.java).apply {
            putExtra("notification_id", notificationId)
            putExtra("sender_name", senderName)
        }
        
        val replyPendingIntent = PendingIntent.getBroadcast(
            context,
            notificationId,
            replyIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
        )
        
        val remoteInput = RemoteInput.Builder(KEY_TEXT_REPLY)
            .setLabel("Reply to $senderName")
            .build()
        
        val replyAction = NotificationCompat.Action.Builder(
            android.R.drawable.ic_menu_send,
            "Reply",
            replyPendingIntent
        )
            .addRemoteInput(remoteInput)
            .setAllowGeneratedReplies(true)
            .setSemanticAction(NotificationCompat.Action.SEMANTIC_ACTION_REPLY)
            .build()
        
        val sender = Person.Builder()
            .setName(senderName)
            .build()
        
        val messagingStyle = NotificationCompat.MessagingStyle(sender)
            .addMessage(message, System.currentTimeMillis(), sender)
        
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_email)
            .setContentTitle(senderName)
            .setContentText(message)
            .setStyle(messagingStyle)
            .addAction(replyAction)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
        
        notificationManager.notify(notificationId, notification)
        appendNotificationLog(context, senderName, message, notificationId)
        
        return notificationId
    }

    private fun appendNotificationLog(
        context: Context,
        senderName: String,
        message: String,
        notificationId: Int
    ) {
        val prefs = context.getSharedPreferences(LOG_PREFS_NAME, Context.MODE_PRIVATE)
        val existingLogs = prefs.getString(LOG_KEY, "") ?: ""
        val now = System.currentTimeMillis()
        val packageName = context.packageName
        val appName = "Test Messages"
        val sanitizedTitle = senderName.replace("\n", " ").replace("|", " ")
        val sanitizedText = message.replace("\n", " ").replace("|", " ")

        val logEntry = "$now|$packageName|$appName|$sanitizedTitle|$sanitizedText|$now|$notificationId|0|"
        val updatedLogs = if (existingLogs.isEmpty()) {
            logEntry
        } else {
            "$existingLogs\n$logEntry"
        }

        prefs.edit().putString(LOG_KEY, updatedLogs).apply()
    }
    
    private fun createNotificationChannel(context: Context, notificationManager: NotificationManager) {
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Test message notifications for auto-reply testing"
            lockscreenVisibility = NotificationCompat.VISIBILITY_PUBLIC
            enableVibration(true)
        }
        notificationManager.createNotificationChannel(channel)
    }
    
    class ReplyReceiver : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            val remoteInput = RemoteInput.getResultsFromIntent(intent)
            if (remoteInput != null) {
                val replyText = remoteInput.getCharSequence(KEY_TEXT_REPLY)
                val notificationId = intent.getIntExtra("notification_id", -1)
                val senderName = intent.getStringExtra("sender_name") ?: "Unknown"
                
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                
                val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle("Reply Sent")
                    .setContentText("You replied to $senderName: $replyText")
                    .setPriority(NotificationCompat.PRIORITY_LOW)
                    .setAutoCancel(true)
                    .build()
                
                notificationManager.notify(notificationId + 1000, notification)
                notificationManager.cancel(notificationId)
            }
        }
    }
}
