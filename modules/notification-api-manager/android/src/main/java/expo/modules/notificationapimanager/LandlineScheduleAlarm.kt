package expo.modules.notificationapimanager

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log

object LandlineScheduleAlarm {
    private const val TAG = "LandlineScheduleAlarm"
    private const val REQUEST_CODE = 48121
    const val ACTION_BOUNDARY = "expo.modules.notificationapimanager.SCHEDULE_BOUNDARY"
    const val EXTRA_TRIGGER_AT = "triggerAt"

    fun canScheduleExact(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        return alarmManager.canScheduleExactAlarms()
    }

    fun requestExactAlarmPermission(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
        return try {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = Uri.parse("package:${context.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            true
        } catch (e: Exception) {
            Log.w(TAG, "Unable to open exact alarm settings", e)
            false
        }
    }

    fun arm(context: Context, triggerAt: Long) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val pending = pendingIntent(context, triggerAt)
        try {
            if (canScheduleExact(context)) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
            }
        } catch (e: SecurityException) {
            Log.w(TAG, "Exact alarm denied, falling back to inexact", e)
            alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending)
        }
    }

    fun cancel(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        alarmManager.cancel(pendingIntent(context, 0L))
    }

    private fun pendingIntent(context: Context, triggerAt: Long): PendingIntent {
        val intent = Intent(context, LandlineScheduleReceiver::class.java).apply {
            action = ACTION_BOUNDARY
            putExtra(EXTRA_TRIGGER_AT, triggerAt)
            setPackage(context.packageName)
        }
        return PendingIntent.getBroadcast(
            context,
            REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }
}
