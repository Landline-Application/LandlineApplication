import androidx.room.Entity

@Entity(tableName = "notification_db")
data class NotificationEntity (
     @PrimaryKey(autoGenerate = true)
     val id: Int = 0,
     val key: String,
     val packageName: String,
     val appName: String,
     val title: String,
     val content: ByteArray?,
     val timestamp: Long
)
