package expo.modules.notificationapimanager

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Rearms schedule alarms after reboot, clock changes, and app updates. */
class LandlineScheduleBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        if (
            action != Intent.ACTION_BOOT_COMPLETED &&
            action != Intent.ACTION_TIME_CHANGED &&
            action != Intent.ACTION_TIMEZONE_CHANGED &&
            action != Intent.ACTION_MY_PACKAGE_REPLACED
        ) {
            return
        }
        val pending = goAsync()
        try {
            LandlineScheduleController.onClockOrBoot(context.applicationContext)
        } catch (e: Exception) {
            Log.e(TAG, "Schedule rearm failed", e)
        } finally {
            pending.finish()
        }
    }

    companion object {
        private const val TAG = "LandlineSchedule"
    }
}
