import androidx.room.Dao

@Dao
interface NotificationDao (
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun insertNotifications(vararg notification: NotificationEntity)
    
    @Update
    suspend fun updateNotifications(vararg notification: NotificationEntity)

    @Delete
    suspend fun deleteNotifications(vararg notification: NotificationEntity)

    @Query("SELECT * FROM notification_db")
    suspend fun loadAll_notifications() : FLOW<List<NotificationEntity>>
    )
