package expo.modules.dndmanager

import android.app.AutomaticZenRule
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.service.notification.Condition
import android.util.Log
import androidx.annotation.RequiresApi
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.records.Field
import androidx.core.net.toUri
import androidx.core.os.bundleOf
import expo.modules.kotlin.records.Record
import kotlin.io.resolve


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

class DndManagerModule : Module() {
    private val context: Context
        get() = requireNotNull(appContext.reactContext)

    private val notificationManager: NotificationManager
        get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private var currentRuleId: String? = null

    companion object {
        private const val TAG = "DNDController"
        private const val RULE_NAME = "Expo DND Control"
        private const val CONDITION_ID_PREFIX = "app://"
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

                // Note: We can't wait for the result, user must check manually
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

        AsyncFunction("setDNDEnabled") { enabled: Boolean, promise: Promise ->
            val result = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
                val notificationManager =
                    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

                // Check if we have permission
                if (!notificationManager.isNotificationPolicyAccessGranted) {
                    createDNDResult(
                        success = false, message = "Permission not granted"
                    )
                }

                try {
                    val policy = NotificationManager.Policy(
                        // Allow all priority categories
                        NotificationManager.Policy.PRIORITY_CATEGORY_CALLS or
                                NotificationManager.Policy.PRIORITY_CATEGORY_MESSAGES or
                                NotificationManager.Policy.PRIORITY_CATEGORY_EVENTS or
                                NotificationManager.Policy.PRIORITY_CATEGORY_REMINDERS or
                                NotificationManager.Policy.PRIORITY_CATEGORY_REPEAT_CALLERS or
                                NotificationManager.Policy.PRIORITY_CATEGORY_ALARMS or
                                NotificationManager.Policy.PRIORITY_CATEGORY_MEDIA,

                        NotificationManager.Policy.PRIORITY_SENDERS_ANY, // Allow all call senders
                        NotificationManager.Policy.PRIORITY_SENDERS_ANY, // Allow all message senders
                        NotificationManager.Policy.SUPPRESSED_EFFECT_SCREEN_OFF, // Visual effects to suppress
                        NotificationManager.Policy.CONVERSATION_SENDERS_ANYONE // Allow all conversations
                    )
                    notificationManager.notificationPolicy = policy
                    // This still works on API 35+ and creates an implicit AutomaticZenRule
                    notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                    createDNDResult(
                        success = true,
                        message = "DND enabled",
                        currentState = notificationManager.currentInterruptionFilter
                    )
                } catch (e: SecurityException) {
                    // Permission was revoked or insufficient
                    createDNDResult(
                        success = false, message = "Permission not granted"
                    )
                } catch (e: Exception) {
                    // Other error
                    createDNDResult(
                        success = false, message = "Failed to set DND: ${e.message}"
                    )
                }
            } else {
                createDNDResult(
                    success = false, message = "DND control not supported on this Android version"
                )
            }
            promise.resolve(result)
        }
    }


    private fun createDNDResult(
        success: Boolean, message: String, currentState: Int? = null, ruleId: String? = null
    ): DNDResult {
        return DNDResult().apply {
            this.success = success
            this.message = message
            this.currentState = currentState
            this.ruleId = ruleId
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
}