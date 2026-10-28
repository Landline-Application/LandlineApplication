package expo.modules.usagestatsmanager

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.os.Build
import android.provider.Settings
import android.app.usage.UsageStatsManager
import android.app.usage.UsageStats
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.FileOutputStream
import java.util.Calendar

class UsageStatsManagerModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("UsageStatsManager")

        Function("hasUsageStatsPermission") {
            val ctx = appContext.reactContext ?: return@Function false
            hasUsagePermission(ctx)
        }

        Function("openUsageStatsSettings") {
            val ctx = appContext.reactContext ?: return@Function false
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            ctx.startActivity(intent)
            true
        }

        Function("getTopUsageApps") { days: Int, limit: Int ->
            val ctx = appContext.reactContext ?: return@Function emptyList<Map<String, Any>>()
            if (!hasUsagePermission(ctx)) return@Function emptyList<Map<String, Any>>()

            val usageStatsManager = ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val calendar = Calendar.getInstance()
            calendar.add(Calendar.DAY_OF_YEAR, -days)
            
            val stats = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                calendar.timeInMillis,
                System.currentTimeMillis()
            )

            if (stats == null) return@Function emptyList<Map<String, Any>>()

            val aggregated = mutableMapOf<String, Long>()
            val safeLimit = if (limit <= 0) 10 else limit
            val packageManager = ctx.packageManager

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

                    val iconUri = try {
                        val appInfo = packageManager.getApplicationInfo(pkg, 0)
                        val drawable = packageManager.getApplicationIcon(appInfo)
                        saveIconToCache(ctx, pkg, drawable)
                    } catch (_: Exception) {
                        null
                    }

                    val entry = mutableMapOf<String, Any>(
                        "packageName" to pkg,
                        "appName" to appName,
                        "totalTimeMs" to totalTime
                    )
                    if (iconUri != null) {
                        entry["iconUri"] = iconUri
                    }
                    entry
                }

            appUsage
        }

        // Per-app totals for each local calendar day. Used by usage targets.
        AsyncFunction("getDailyAppUsage") { packageNames: List<String>, days: Int, promise: Promise ->
            val ctx = appContext.reactContext
            if (ctx == null || !hasUsagePermission(ctx)) {
                promise.resolve(emptyList<Map<String, Any>>())
                return@AsyncFunction
            }

            try {
                val safeDays = days.coerceIn(1, 90)
                val requested = packageNames
                    .map { it.trim() }
                    .filter { it.isNotEmpty() && it != ctx.packageName }
                    .distinct()
                if (requested.isEmpty()) {
                    promise.resolve(emptyList<Map<String, Any>>())
                    return@AsyncFunction
                }

                val wanted = requested.toHashSet()
                val usageStatsManager =
                    ctx.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
                val end = System.currentTimeMillis()
                val calendar = Calendar.getInstance()
                calendar.timeInMillis = end
                calendar.set(Calendar.HOUR_OF_DAY, 0)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                calendar.set(Calendar.MILLISECOND, 0)
                // One extra day so a bucket that starts just before local midnight is included.
                calendar.add(Calendar.DAY_OF_YEAR, -(safeDays))
                val start = calendar.timeInMillis

                val stats = usageStatsManager.queryUsageStats(
                    UsageStatsManager.INTERVAL_DAILY,
                    start,
                    end
                )

                val totalsByPackage = mutableMapOf<String, MutableMap<String, Long>>()
                if (stats != null) {
                    for (stat in stats) {
                        if (stat.packageName !in wanted) continue
                        val totalTime = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                            stat.totalTimeVisible
                        } else {
                            stat.totalTimeInForeground
                        }
                        if (totalTime <= 0L) continue
                        val day = dayKey(stat.firstTimeStamp)
                        val byDay = totalsByPackage.getOrPut(stat.packageName) { mutableMapOf() }
                        byDay[day] = (byDay[day] ?: 0L) + totalTime
                    }
                }

                val packageManager = ctx.packageManager
                val result = requested.map { pkg ->
                    val appName = try {
                        val appInfo = packageManager.getApplicationInfo(pkg, 0)
                        packageManager.getApplicationLabel(appInfo).toString()
                    } catch (_: Exception) {
                        pkg
                    }
                    val iconUri = try {
                        val appInfo = packageManager.getApplicationInfo(pkg, 0)
                        val drawable = packageManager.getApplicationIcon(appInfo)
                        saveIconToCache(ctx, pkg, drawable)
                    } catch (_: Exception) {
                        null
                    }
                    val dayEntries = (totalsByPackage[pkg] ?: emptyMap()).map { (date, total) ->
                        mapOf(
                            "date" to date,
                            "totalTimeMs" to total
                        )
                    }
                    val entry = mutableMapOf<String, Any>(
                        "packageName" to pkg,
                        "appName" to appName,
                        "days" to dayEntries
                    )
                    if (iconUri != null) {
                        entry["iconUri"] = iconUri
                    }
                    entry
                }

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("USAGE_DAILY_FAILED", "Failed to read daily app usage: ${e.message}", e)
            }
        }
    }

    private fun saveIconToCache(context: Context, packageName: String, drawable: Drawable): String? {
        return try {
            val cacheDir = File(context.cacheDir, "app_icons")
            if (!cacheDir.exists()) cacheDir.mkdirs()
            
            val iconFile = File(cacheDir, "${packageName}.png")
            
            val size = 96
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, size, size)
            drawable.draw(canvas)
            
            val out = FileOutputStream(iconFile)
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, out)
            out.flush()
            out.close()
            bitmap.recycle()
            
            "file://${iconFile.absolutePath}"
        } catch (e: Exception) {
            null
        }
    }

    private fun dayKey(timeMs: Long): String {
        val calendar = Calendar.getInstance()
        calendar.timeInMillis = timeMs
        val year = calendar.get(Calendar.YEAR)
        val month = calendar.get(Calendar.MONTH) + 1
        val day = calendar.get(Calendar.DAY_OF_MONTH)
        return "%04d-%02d-%02d".format(year, month, day)
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
