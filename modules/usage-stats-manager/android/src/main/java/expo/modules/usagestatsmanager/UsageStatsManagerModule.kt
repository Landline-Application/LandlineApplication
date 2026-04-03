package expo.modules.usagestatsmanager

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.os.Build
import android.provider.Settings
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

class UsageStatsManagerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("UsageStatsManager")

        Function("hasUsageStatsPermission") {
            val ctx = appContext.reactContext ?: return@Function false
            hasUsagePermission(ctx)
        }

        AsyncFunction("openUsageStatsSettings") {
            val ctx = appContext.reactContext ?: return@AsyncFunction false
            return@AsyncFunction try {
                val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                ctx.startActivity(intent)
                true
            } catch (_: Exception) {
                false
            }
        }

        AsyncFunction("getTopUsageApps") { days: Int, limit: Int ->
            val ctx = appContext.reactContext ?: return@AsyncFunction emptyList<Map<String, Any>>()
            if (!hasUsagePermission(ctx)) {
                return@AsyncFunction emptyList<Map<String, Any>>()
            }

            val safeDays = days.coerceAtLeast(1)
            val safeLimit = limit.coerceAtLeast(1)
            val end = System.currentTimeMillis()
            val start = end - safeDays * 24L * 60L * 60L * 1000L

            val usageStatsManager =
                ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val stats =
                usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, start, end)
                    ?: emptyList()

            val packageManager = ctx.packageManager

            // INTERVAL_DAILY returns one entry per package per day bucket — group and sum first.
            val aggregated = mutableMapOf<String, Long>()
            for (stat in stats) {
                if (stat.packageName == ctx.packageName) continue
                val totalTime = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    stat.totalTimeVisible
                } else {
                    stat.totalTimeInForeground
                }
                if (totalTime <= 0L) continue
                aggregated[stat.packageName] = (aggregated[stat.packageName] ?: 0L) + totalTime
            }

            val appUsage = aggregated.entries
                .sortedByDescending { it.value }
                .take(safeLimit)
                .mapNotNull { (pkg, totalTime) ->
                    val appName = try {
                        val appInfo = packageManager.getApplicationInfo(pkg, 0)
                        packageManager.getApplicationLabel(appInfo).toString()
                    } catch (_: Exception) {
                        pkg
                    }

                    val iconBase64 = try {
                        val appInfo = packageManager.getApplicationInfo(pkg, 0)
                        val drawable = packageManager.getApplicationIcon(appInfo)
                        drawableToBase64(drawable)
                    } catch (_: Exception) {
                        null
                    }

                    val entry = mutableMapOf<String, Any>(
                        "packageName" to pkg,
                        "appName" to appName,
                        "totalTimeMs" to totalTime
                    )
                    if (iconBase64 != null) {
                        entry["iconBase64"] = iconBase64
                    }
                    entry
                }

            appUsage
        }
    }

    private fun drawableToBase64(drawable: Drawable): String? {
        return try {
            val size = 48
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, size, size)
            drawable.draw(canvas)
            val stream = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.PNG, 90, stream)
            bitmap.recycle()
            Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
        } catch (_: Exception) {
            null
        }
    }

    private fun hasUsagePermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }
}
