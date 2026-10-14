package expo.modules.notificationapimanager

import android.os.Handler
import android.os.Looper

/**
 * Delivers schedule-driven Landline Mode changes to the running JS runtime.
 * Null when the app process has no React Native module instance.
 */
object LandlineScheduleBridge {
    @Volatile
    var listener: ((Boolean) -> Unit)? = null

    fun notifyMode(active: Boolean) {
        val callback = listener ?: return
        if (Looper.myLooper() == Looper.getMainLooper()) {
            callback(active)
            return
        }
        Handler(Looper.getMainLooper()).post { callback(active) }
    }
}
