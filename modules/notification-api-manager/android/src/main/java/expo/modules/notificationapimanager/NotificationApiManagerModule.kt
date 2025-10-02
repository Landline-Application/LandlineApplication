package expo.modules.notificationapimanager

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationApiManagerModule : Module() {
    override fun definition() = ModuleDefinition {
        // JS name: requireNativeModule('NotificationApiManager')
        Name("NotificationApiManager")

        // Quick smoke test
        Function("hello") {
            "Hello from NotificationApiManager!"
        }

        // Android 13+ runtime notification permission (older versions don't require it)
        Function("hasPostPermission") {
            val ctx = appContext.reactContext ?: return@Function false
            if (Build.VERSION.SDK_INT < 33) {
                true
            } else {
                ContextCompat.checkSelfPermission(
                    ctx,
                    Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
            }
        }

        // Opens the app's system notification settings. Returns true if we could launch it.
        AsyncFunction("requestPostPermission") {
            val ctx = appContext.reactContext ?: return@AsyncFunction false
            if (Build.VERSION.SDK_INT < 33) return@AsyncFunction true

            ctx.startActivity(
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
            true
        }

        // Create/update a notification channel (Android O+). Returns true if OK.
        Function("createChannel") { id: String, name: String, importance: Int ->
            val ctx = appContext.reactContext ?: return@Function false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
                if (nm.getNotificationChannel(id) == null) {
                    nm.createNotificationChannel(NotificationChannel(id, name, importance))
                }
            }
            true
        }

        // Post a notification. Returns true if it was posted (or not needed pre-33).
        @SuppressLint("MissingPermission")
        Function("notify") { title: String, body: String, channelId: String, notificationId: Int ->
            val ctx = appContext.reactContext ?: return@Function false

            // Respect Android 13+ permission
            if (Build.VERSION.SDK_INT >= 33) {
                val granted = ContextCompat.checkSelfPermission(
                    ctx, Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
                if (!granted) return@Function false
            }

            val builder = NotificationCompat.Builder(ctx, channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info) // replace with app icon later
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)

            NotificationManagerCompat.from(ctx).notify(notificationId, builder.build())
            true
        }
    }
}