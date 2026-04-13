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

            // Clear old icons before fetching new ones
            clearIconCache(ctx)

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

    private fun clearIconCache(context: Context) {
        try {
            val cacheDir = File(context.cacheDir, "app_icons")
            if (cacheDir.exists()) {
                cacheDir.deleteRecursively()
            }
        } catch (_: Exception) {}
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
