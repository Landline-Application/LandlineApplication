package expo.modules.notificationapimanager

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/** Fires at a schedule start or end, including while the app process was not running. */
class LandlineScheduleReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != LandlineScheduleAlarm.ACTION_BOUNDARY) return
        val pending = goAsync()
        try {
            val triggerAt = intent.getLongExtra(LandlineScheduleAlarm.EXTRA_TRIGGER_AT, 0L)
            LandlineScheduleController.onBoundary(context.applicationContext, triggerAt)
        } catch (e: Exception) {
            Log.e(TAG, "Schedule boundary failed", e)
        } finally {
            pending.finish()
        }
    }

    companion object {
        private const val TAG = "LandlineSchedule"
    }
}
