import expo.modules.notificationapimanager.data.*

class NotificationRepository(private val NotificationDao: dao) {

  val readAll_notifications: LiveData<List<NotificationEntitity>> = dao.loadAll_notifications()
  
  fun add_notification(NotificationEntitity) : Boolean {
        try
        {
            dao.insertNotifications(notification)
            true
        }
        catch

}

