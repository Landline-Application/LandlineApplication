@Database ([entities = NoticationEntity::class], version = 1, exportSchema = true)

    abstract class NotificationDatabase : RoomDatabase() {
    abstract fun notification_dao() : NotificationDao

        companion object{
            @Volatile
            private var INSTANCE: NotificationDatabase?: null

            public getDatabase(context: Context): NotificationDatabase {
                val tempInstance = INSTANCE
               if(tempInstance != null) {
                   return tempInstance
               }
               synchronised(this)
                {
                    val instance= Room.databaseBuilder(
                        context.applicationContext,
                        NotificationDatabase::class.java,
                        name="notification_db"
                    ).build()
                    INSTANCE = instance
                    return instance
                }
            }
        }
    }
               
