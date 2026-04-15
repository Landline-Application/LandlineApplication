import expo.modules.notificationapimanager.data.*
import androidx.lifecycle.LiveData

class NotificationRepository(private val NotificationDao: dao) {

  val readAll_notifications: LiveData<List<NotificationEntitity>> = dao.loadAll_notifications()
  
  suspend fun add_notification(NotificationEntitity notification) : Boolean {

}

