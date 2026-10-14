package expo.modules.notificationapimanager

import android.app.NotificationManager
import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.Calendar

/**
 * Recurring Landline Mode schedules. Alarms and boot receivers call this without
 * a React Native runtime so windows still open and close after the app is closed.
 */
object LandlineScheduleController {
    private const val TAG = "LandlineSchedule"
    private const val PREFS_NAME = "landline_mode_prefs"
    private const val KEY_ACTIVE = "is_landline_mode_active"
    private const val KEY_SCHEDULES = "landline_schedules_json"
    private const val KEY_OVERRIDE_UNTIL = "schedule_manual_override_until_ms"
    private const val KEY_MODE_SET_BY = "landline_mode_set_by"
    private const val KEY_SESSION_START = "schedule_session_start_ms"
    private const val KEY_PENDING_START = "schedule_pending_session_start_ms"
    private const val KEY_PENDING_END = "schedule_pending_session_end_ms"
    private const val SOURCE_SCHEDULE = "schedule"
    private const val SOURCE_MANUAL = "manual"
    private const val MAX_SCHEDULES = 20
    private val ID_PATTERN = Regex("^[A-Za-z0-9_-]{1,64}$")

    data class LandlineSchedule(
        val id: String,
        val enabled: Boolean,
        val startMinutes: Int,
        val endMinutes: Int,
        val days: Set<Int>,
        val name: String,
    )

    fun readJson(context: Context): String {
        return prefs(context).getString(KEY_SCHEDULES, "[]") ?: "[]"
    }

    fun sessionStartMs(context: Context): Long {
        return prefs(context).getLong(KEY_SESSION_START, 0L)
    }

    fun consumePendingSession(context: Context): Pair<Long, Long> {
        val prefs = prefs(context)
        val start = prefs.getLong(KEY_PENDING_START, 0L)
        val end = prefs.getLong(KEY_PENDING_END, 0L)
        if (start != 0L || end != 0L) {
            prefs.edit().remove(KEY_PENDING_START).remove(KEY_PENDING_END).commit()
        }
        if (start <= 0L || end <= start) return 0L to 0L
        return start to end
    }

    fun replaceSchedules(context: Context, json: String): Boolean {
        val schedules = try {
            parseSchedules(json)
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "Rejected schedules: ${e.message}")
            return false
        } catch (e: JSONException) {
            Log.w(TAG, "Rejected schedules JSON", e)
            return false
        }
        prefs(context).edit().putString(KEY_SCHEDULES, toJson(schedules)).commit()
        onSchedulesSaved(context)
        return true
    }

    /**
     * A manual on/off wins until the next schedule boundary and leaves the schedule saved.
     */
    fun noteManualOverride(context: Context) {
        val prefs = prefs(context)
        val active = prefs.getBoolean(KEY_ACTIVE, false)
        val editor = prefs.edit().putString(KEY_MODE_SET_BY, SOURCE_MANUAL)
        if (active) {
            editor.putLong(KEY_SESSION_START, System.currentTimeMillis())
        } else {
            editor.remove(KEY_SESSION_START)
        }
        val next = nextBoundary(load(context).filter { it.enabled }, System.currentTimeMillis())
        if (next == null) {
            editor.remove(KEY_OVERRIDE_UNTIL)
        } else {
            editor.putLong(KEY_OVERRIDE_UNTIL, next)
        }
        editor.commit()
    }

    fun onClockOrBoot(context: Context) {
        val enabled = load(context).filter { it.enabled }
        if (enabled.isEmpty()) {
            LandlineScheduleAlarm.cancel(context)
            return
        }
        val now = System.currentTimeMillis()
        armNext(context, enabled, now)
        val overrideUntil = prefs(context).getLong(KEY_OVERRIDE_UNTIL, 0L)
        if (overrideUntil > now) return
        if (overrideUntil != 0L) {
            prefs(context).edit().remove(KEY_OVERRIDE_UNTIL).commit()
        }
        setActive(context, covers(enabled, now), SOURCE_SCHEDULE)
    }

    fun onBoundary(context: Context, triggerAt: Long) {
        val now = System.currentTimeMillis()
        if (triggerAt > 0L && now + 15_000L < triggerAt) {
            LandlineScheduleAlarm.arm(context, triggerAt)
            return
        }
        val evaluateAt = if (triggerAt > now) triggerAt else now
        val enabled = load(context).filter { it.enabled }
        if (enabled.isEmpty()) {
            LandlineScheduleAlarm.cancel(context)
            return
        }
        armNext(context, enabled, evaluateAt)
        val overrideUntil = prefs(context).getLong(KEY_OVERRIDE_UNTIL, 0L)
        if (overrideUntil > evaluateAt) return
        if (overrideUntil != 0L) {
            prefs(context).edit().remove(KEY_OVERRIDE_UNTIL).commit()
        }
        setActive(context, covers(enabled, evaluateAt), SOURCE_SCHEDULE)
    }

    private fun onSchedulesSaved(context: Context) {
        val enabled = load(context).filter { it.enabled }
        val prefs = prefs(context)
        if (enabled.isEmpty()) {
            LandlineScheduleAlarm.cancel(context)
            prefs.edit().remove(KEY_OVERRIDE_UNTIL).commit()
            if (prefs.getString(KEY_MODE_SET_BY, "") == SOURCE_SCHEDULE &&
                prefs.getBoolean(KEY_ACTIVE, false)
            ) {
                setActive(context, false, SOURCE_SCHEDULE)
            }
            return
        }
        val now = System.currentTimeMillis()
        armNext(context, enabled, now)
        val overrideUntil = prefs.getLong(KEY_OVERRIDE_UNTIL, 0L)
        if (overrideUntil > now) return
        if (covers(enabled, now)) {
            setActive(context, true, SOURCE_SCHEDULE)
        } else if (prefs.getString(KEY_MODE_SET_BY, "") == SOURCE_SCHEDULE) {
            setActive(context, false, SOURCE_SCHEDULE)
        }
    }

    private fun armNext(context: Context, enabled: List<LandlineSchedule>, afterMs: Long) {
        val next = nextBoundary(enabled, afterMs)
        if (next == null) {
            LandlineScheduleAlarm.cancel(context)
        } else {
            LandlineScheduleAlarm.arm(context, next)
        }
    }

    private fun setActive(context: Context, active: Boolean, source: String) {
        val prefs = prefs(context)
        val was = prefs.getBoolean(KEY_ACTIVE, false)
        if (was == active) return

        if (active) {
            applyFocusPolicy(context)
            prefs.edit()
                .putBoolean(KEY_ACTIVE, true)
                .putLong(KEY_SESSION_START, System.currentTimeMillis())
                .putString(KEY_MODE_SET_BY, source)
                .commit()
        } else {
            val start = prefs.getLong(KEY_SESSION_START, 0L)
            val editor = prefs.edit()
                .putBoolean(KEY_ACTIVE, false)
                .putString(KEY_MODE_SET_BY, source)
                .remove(KEY_SESSION_START)
            if (start > 0L) {
                editor.putLong(KEY_PENDING_START, start)
                editor.putLong(KEY_PENDING_END, System.currentTimeMillis())
            }
            editor.commit()
            LandlineNotificationListenerService.clearRepeatCallBypassTracking()
            restoreOpenPolicy(context)
        }
        LandlineScheduleBridge.notifyMode(active)
    }

    private fun applyFocusPolicy(context: Context) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (!notificationManager.isNotificationPolicyAccessGranted) return
        try {
            val policy = NotificationManager.Policy(
                NotificationManager.Policy.PRIORITY_CATEGORY_MESSAGES or
                    NotificationManager.Policy.PRIORITY_CATEGORY_CALLS or
                    NotificationManager.Policy.PRIORITY_CATEGORY_ALARMS,
                NotificationManager.Policy.PRIORITY_SENDERS_STARRED,
                NotificationManager.Policy.PRIORITY_SENDERS_ANY,
            )
            notificationManager.setNotificationPolicy(policy)
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
        } catch (e: SecurityException) {
            Log.w(TAG, "Unable to apply Do Not Disturb policy", e)
        }
    }

    private fun restoreOpenPolicy(context: Context) {
        val notificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (!notificationManager.isNotificationPolicyAccessGranted) return
        try {
            val policy = NotificationManager.Policy(
                NotificationManager.Policy.PRIORITY_CATEGORY_MESSAGES or
                    NotificationManager.Policy.PRIORITY_CATEGORY_CALLS or
                    NotificationManager.Policy.PRIORITY_CATEGORY_ALARMS or
                    NotificationManager.Policy.PRIORITY_CATEGORY_EVENTS or
                    NotificationManager.Policy.PRIORITY_CATEGORY_REMINDERS,
                NotificationManager.Policy.PRIORITY_SENDERS_ANY,
                NotificationManager.Policy.PRIORITY_SENDERS_ANY,
            )
            notificationManager.setNotificationPolicy(policy)
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
        } catch (e: SecurityException) {
            Log.w(TAG, "Unable to restore Do Not Disturb policy", e)
        }
    }

    private fun load(context: Context): List<LandlineSchedule> {
        return try {
            parseSchedules(readJson(context))
        } catch (e: Exception) {
            Log.w(TAG, "Stored schedules were unreadable", e)
            emptyList()
        }
    }

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    internal fun covers(schedules: List<LandlineSchedule>, atMs: Long): Boolean {
        return schedules.any { schedule -> schedule.enabled && covers(schedule, atMs) }
    }

    private fun covers(schedule: LandlineSchedule, atMs: Long): Boolean {
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = atMs
        val day = calendar.get(Calendar.DAY_OF_WEEK) - 1
        val minutes = calendar.get(Calendar.HOUR_OF_DAY) * 60 + calendar.get(Calendar.MINUTE)
        val start = schedule.startMinutes
        val end = schedule.endMinutes
        if (end > start) {
            return day in schedule.days && minutes >= start && minutes < end
        }
        val yesterday = (day + 6) % 7
        val startedToday = day in schedule.days && minutes >= start
        val stillRunningFromYesterday = yesterday in schedule.days && minutes < end
        return startedToday || stillRunningFromYesterday
    }

    internal fun nextBoundary(schedules: List<LandlineSchedule>, afterMs: Long): Long? {
        var best: Long? = null
        for (schedule in schedules) {
            if (!schedule.enabled || schedule.days.isEmpty()) continue
            val endDays = if (schedule.endMinutes > schedule.startMinutes) {
                schedule.days
            } else {
                schedule.days.map { (it + 1) % 7 }.toSet()
            }
            val candidates = listOf(
                nextOnDays(schedule.days, schedule.startMinutes, afterMs),
                nextOnDays(endDays, schedule.endMinutes, afterMs),
            )
            for (candidate in candidates) {
                val currentBest = best
                if (candidate != null && (currentBest == null || candidate < currentBest)) {
                    best = candidate
                }
            }
        }
        return best
    }

    private fun nextOnDays(days: Set<Int>, minutesOfDay: Int, afterMs: Long): Long? {
        if (days.isEmpty()) return null
        for (offset in 0..8) {
            val probe = Calendar.getInstance()
            probe.timeInMillis = afterMs
            probe.set(Calendar.SECOND, 0)
            probe.set(Calendar.MILLISECOND, 0)
            probe.set(Calendar.HOUR_OF_DAY, minutesOfDay / 60)
            probe.set(Calendar.MINUTE, minutesOfDay % 60)
            probe.add(Calendar.DAY_OF_YEAR, offset)
            val day = probe.get(Calendar.DAY_OF_WEEK) - 1
            if (day in days && probe.timeInMillis > afterMs) {
                return probe.timeInMillis
            }
        }
        return null
    }

    private fun parseSchedules(json: String): List<LandlineSchedule> {
        val trimmed = json.trim()
        if (trimmed.isEmpty() || trimmed == "[]") return emptyList()
        val array = JSONArray(trimmed)
        if (array.length() > MAX_SCHEDULES) {
            throw IllegalArgumentException("Too many schedules")
        }
        val seen = HashSet<String>()
        val result = ArrayList<LandlineSchedule>(array.length())
        for (index in 0 until array.length()) {
            val obj = array.getJSONObject(index)
            val id = obj.getString("id")
            if (!ID_PATTERN.matches(id) || !seen.add(id)) {
                throw IllegalArgumentException("Invalid schedule id")
            }
            val start = obj.getInt("startMinutes")
            val end = obj.getInt("endMinutes")
            if (start !in 0..1439 || end !in 0..1439 || start == end) {
                throw IllegalArgumentException("Invalid schedule time")
            }
            val daysJson = obj.getJSONArray("days")
            if (daysJson.length() == 0) {
                throw IllegalArgumentException("Schedule needs a day")
            }
            val days = HashSet<Int>()
            for (dayIndex in 0 until daysJson.length()) {
                val day = daysJson.getInt(dayIndex)
                if (day !in 0..6) throw IllegalArgumentException("Invalid day")
                days.add(day)
            }
            val name = obj.optString("name", "").replace("\n", " ").trim().take(40)
            val enabled = if (obj.has("enabled")) obj.getBoolean("enabled") else true
            result.add(LandlineSchedule(id, enabled, start, end, days, name))
        }
        return result
    }

    private fun toJson(schedules: List<LandlineSchedule>): String {
        val array = JSONArray()
        for (schedule in schedules) {
            val days = JSONArray()
            schedule.days.sorted().forEach { days.put(it) }
            val obj = JSONObject()
                .put("id", schedule.id)
                .put("enabled", schedule.enabled)
                .put("startMinutes", schedule.startMinutes)
                .put("endMinutes", schedule.endMinutes)
                .put("name", schedule.name)
                .put("days", days)
            array.put(obj)
        }
        return array.toString()
    }
}
