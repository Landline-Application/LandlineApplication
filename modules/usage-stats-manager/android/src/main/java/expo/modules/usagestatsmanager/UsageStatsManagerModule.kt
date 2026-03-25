package expo.modules.usagestatsmanager

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

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
            val appUsage = stats
                .filter { it.packageName != ctx.packageName }
                .mapNotNull { stat ->
                    val totalTime = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        stat.totalTimeVisible
                    } else {
                        stat.totalTimeInForeground
                    }
                    if (totalTime <= 0L) return@mapNotNull null

                    val appName = try {
                        val appInfo = packageManager.getApplicationInfo(stat.packageName, 0)
                        packageManager.getApplicationLabel(appInfo).toString()
                    } catch (_: Exception) {
                        stat.packageName
                    }

                    mapOf(
                        "packageName" to stat.packageName,
                        "appName" to appName,
                        "totalTimeMs" to totalTime
                    )
                }
                .sortedByDescending { (it["totalTimeMs"] as? Long) ?: 0L }
                .take(safeLimit)

            appUsage
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
