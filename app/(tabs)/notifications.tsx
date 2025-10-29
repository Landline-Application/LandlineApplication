import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import NotificationApiManager from "@/modules/notification-api-manager";

interface Notification {
  timestamp: number;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  postTime: number;
  id: number;
}

interface CategoryCount {
  category: string;
  count: number;
  icon: string;
  color: string;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const categorizeNotifications = (notifs: Notification[]): CategoryCount[] => {
    const counts = {
      texts: 0,
      emails: 0,
      calls: 0,
      voicemails: 0,
      apps: 0,
    };

    notifs.forEach((notif) => {
      const pkg = notif.packageName.toLowerCase();
      const title = notif.title.toLowerCase();

      if (
        pkg.includes("messaging") ||
        pkg.includes("sms") ||
        pkg.includes("mms")
      ) {
        counts.texts++;
      } else if (
        pkg.includes("mail") ||
        pkg.includes("gmail") ||
        pkg.includes("outlook")
      ) {
        counts.emails++;
      } else if (
        pkg.includes("phone") ||
        pkg.includes("dialer") ||
        title.includes("missed call")
      ) {
        counts.calls++;
      } else if (pkg.includes("voicemail") || title.includes("voicemail")) {
        counts.voicemails++;
      } else {
        counts.apps++;
      }
    });

    return [
      { category: "Texts", count: counts.texts, icon: "💬", color: "#4CAF50" },
      {
        category: "Emails",
        count: counts.emails,
        icon: "📧",
        color: "#2196F3",
      },
      {
        category: "Missed Calls",
        count: counts.calls,
        icon: "📞",
        color: "#F44336",
      },
      {
        category: "Voicemails",
        count: counts.voicemails,
        icon: "🎙️",
        color: "#FF9800",
      },
      {
        category: "App Notifications",
        count: counts.apps,
        icon: "🔔",
        color: "#9C27B0",
      },
    ];
  };

  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await NotificationApiManager.getLoggedNotifications();
      setNotifications(notifs);
      setCategories(categorizeNotifications(notifs));
    } catch (error) {
      console.error("Failed to load notifications:", error);
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleClearAll = async () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to clear all logged notifications?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              void NotificationApiManager.clearLoggedNotifications();
              setNotifications([]);
              setCategories(categorizeNotifications([]));
              Alert.alert("Success", "All notifications cleared");
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
              Alert.alert("Error", "Failed to clear notifications");
            }
          },
        },
      ],
    );
  };

  const handleCategoryPress = (category: string) => {
    const filtered = notifications.filter((notif) => {
      const pkg = notif.packageName.toLowerCase();
      const title = notif.title.toLowerCase();

      switch (category) {
        case "Texts":
          return (
            pkg.includes("messaging") ||
            pkg.includes("sms") ||
            pkg.includes("mms")
          );
        case "Emails":
          return (
            pkg.includes("mail") ||
            pkg.includes("gmail") ||
            pkg.includes("outlook")
          );
        case "Missed Calls":
          return (
            pkg.includes("phone") ||
            pkg.includes("dialer") ||
            title.includes("missed call")
          );
        case "Voicemails":
          return pkg.includes("voicemail") || title.includes("voicemail");
        case "App Notifications":
          return !(
            pkg.includes("messaging") ||
            pkg.includes("sms") ||
            pkg.includes("mms") ||
            pkg.includes("mail") ||
            pkg.includes("gmail") ||
            pkg.includes("outlook") ||
            pkg.includes("phone") ||
            pkg.includes("dialer") ||
            pkg.includes("voicemail") ||
            title.includes("missed call") ||
            title.includes("voicemail")
          );
        default:
          return false;
      }
    });

    router.push({
      pathname: "/notification-detail",
      params: { category, notifications: JSON.stringify(filtered) },
    });
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const totalCount = notifications.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSubtitle}>
          {totalCount} {totalCount === 1 ? "notification" : "notifications"}{" "}
          logged
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#667eea"]}
          />
        }
      >
        {totalCount === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Notifications Yet</Text>
            <Text style={styles.emptyText}>
              Activate Landline Mode to start capturing your notifications
            </Text>
          </View>
        ) : (
          <>
            {/* Category Cards */}
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.category}
                  style={[styles.categoryCard, { borderLeftColor: cat.color }]}
                  onPress={() => handleCategoryPress(cat.category)}
                  disabled={cat.count === 0}
                >
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={[styles.categoryCount, { color: cat.color }]}>
                      {cat.count}
                    </Text>
                  </View>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  {cat.count > 0 && (
                    <Text style={styles.categorySubtext}>Tap to view</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Recent Notifications Preview */}
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              {notifications.slice(0, 5).map((notif, index) => (
                <View
                  key={`${notif.id}-${index}`}
                  style={styles.notificationItem}
                >
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationApp} numberOfLines={1}>
                      {notif.appName}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTime(notif.postTime)}
                    </Text>
                  </View>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  {notif.text && (
                    <Text style={styles.notificationText} numberOfLines={2}>
                      {notif.text}
                    </Text>
                  )}
                </View>
              ))}
              {notifications.length > 5 && (
                <Text style={styles.moreText}>
                  + {notifications.length - 5} more notifications
                </Text>
              )}
            </View>

            {/* Clear All Button */}
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearAll}
            >
              <Text style={styles.clearButtonText}>
                Clear All Notifications
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  categoryCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryCount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  categorySubtext: {
    fontSize: 12,
    color: "#999",
  },
  recentSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationApp: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  moreText: {
    textAlign: "center",
    color: "#667eea",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
  },
  clearButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff4444",
    marginBottom: 20,
  },
  clearButtonText: {
    color: "#ff4444",
    fontSize: 16,
    fontWeight: "600",
  },
});
