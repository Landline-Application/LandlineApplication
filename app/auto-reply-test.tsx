import { Image } from "expo-image";
import { Alert, Button, Platform, StyleSheet } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useState, useEffect } from "react";
import * as Notifications from "expo-notifications";

import {
  isListenerEnabled,
  requestListenerPermission,
  isAutoReplyEnabled,
  setAutoReplyEnabled,
  setReplyMessage,
  getReplyMessage,
  setAllowedApps,
  getAllowedApps,
  isServiceRunning,
  getActiveNotifications,
  sendTestNotification,
  getReplyHistory,
  clearReplyHistory,
} from "@/modules/auto-reply-manager";

export default function AutoReplyTestScreen() {
  const [status, setStatus] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  async function requestNotificationPermissions() {
    if (Platform.OS === "android") {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Please enable notification permission in settings",
          );
        }
      }
    }
  }

  async function checkListenerPermission() {
    const hasPermission = isListenerEnabled();
    Alert.alert("Listener Permission", `Has permission: ${hasPermission}`);
  }

  async function requestPermission() {
    const result = await requestListenerPermission();
    Alert.alert("Request Permission", JSON.stringify(result, null, 2));
  }

  async function checkAutoReplyStatus() {
    const enabled = isAutoReplyEnabled();
    const running = isServiceRunning();
    setStatus(
      `Auto-reply: ${enabled ? "ON" : "OFF"}, Service: ${running ? "Running" : "Stopped"}`,
    );
    Alert.alert(
      "Auto-Reply Status",
      `Enabled: ${enabled}\nService Running: ${running}`,
    );
  }

  async function enableAutoReply() {
    const result = await setAutoReplyEnabled(true);
    Alert.alert("Enable Auto-Reply", JSON.stringify(result, null, 2));
  }

  async function disableAutoReply() {
    const result = await setAutoReplyEnabled(false);
    Alert.alert("Disable Auto-Reply", JSON.stringify(result, null, 2));
  }

  async function updateReplyMessage() {
    const result = await setReplyMessage(
      "I'm in a meeting right now. I'll get back to you soon!",
    );
    Alert.alert("Update Message", JSON.stringify(result, null, 2));
  }

  async function showCurrentMessage() {
    const message = getReplyMessage();
    Alert.alert("Current Reply Message", message);
  }

  async function setWhatsAppOnly() {
    const result = await setAllowedApps(["com.whatsapp"]);
    Alert.alert("Set WhatsApp Only", JSON.stringify(result, null, 2));
  }

  async function setMessagingApps() {
    const apps = [
      "com.whatsapp",
      "com.facebook.orca",
      "org.telegram.messenger",
      "com.instagram.android",
      "com.google.android.apps.messaging",
    ];
    const result = await setAllowedApps(apps);
    Alert.alert(
      "Set Messaging Apps",
      `Set ${apps.length} apps\n${JSON.stringify(result, null, 2)}`,
    );
  }

  async function allowAllApps() {
    const result = await setAllowedApps([]);
    Alert.alert("Allow All Apps", JSON.stringify(result, null, 2));
  }

  async function showAllowedApps() {
    const apps = getAllowedApps();
    Alert.alert(
      "Allowed Apps",
      apps.length > 0
        ? `${apps.length} apps:\n${apps.join("\n")}`
        : "All apps allowed (empty list)",
    );
  }

  async function checkServiceStatus() {
    const running = isServiceRunning();
    Alert.alert("Service Status", running ? "Running ✓" : "Not Running ✗");
  }

  async function showActiveNotifications() {
    const notifications = await getActiveNotifications();
    setNotificationCount(notifications.length);

    if (notifications.length === 0) {
      Alert.alert("Active Notifications", "No notifications found");
      return;
    }

    const summary = notifications
      .slice(0, 5)
      .map((n) => {
        return `${n.packageName}\n${n.title || "No title"}\n${n.text || "No text"}\nReply: ${n.hasReplyAction ? "✓" : "✗"}`;
      })
      .join("\n\n");

    Alert.alert(
      "Active Notifications",
      `Found ${notifications.length} notifications\n\nFirst 5:\n\n${summary}`,
    );
  }

  async function showNotificationDetails() {
    const notifications = await getActiveNotifications();

    if (notifications.length === 0) {
      Alert.alert("Notification Details", "No notifications found");
      return;
    }

    const first = notifications[0];
    const details = JSON.stringify(first, null, 2);
    Alert.alert("First Notification", details);
  }

  async function sendTestMessage() {
    const result = await sendTestNotification(
      "John Doe",
      "Hey! Are you available for a call?",
    );
    Alert.alert(
      "Test Notification Sent",
      `${JSON.stringify(result, null, 2)}\n\n✅ Pull down from the top of the screen to see the notification!\n\nIf you don't see it, the emulator might have display issues. Try on a real device.`,
      [
        {
          text: "OK",
          onPress: () => {
            // Programmatically open notification shade
            const { Platform } = require("react-native");
            if (Platform.OS === "android") {
              require("react-native").NativeModules.StatusBarManager?.expandNotifications?.();
            }
          },
        },
      ],
    );
  }

  async function sendMultipleTests() {
    const messages = [
      { sender: "Alice", message: "Can you review my PR?" },
      { sender: "Bob", message: "Meeting in 10 minutes" },
      { sender: "Charlie", message: "Did you see my message?" },
    ];

    for (const msg of messages) {
      await sendTestNotification(msg.sender, msg.message);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    Alert.alert(
      "Test Notifications",
      `Sent ${messages.length} test notifications`,
    );
  }

  function viewReplyHistory() {
    const history = getReplyHistory();

    if (history.length === 0) {
      Alert.alert("Reply History", "No replies sent yet");
      return;
    }

    const formatted = history
      .reverse()
      .slice(0, 10)
      .map((item, index) => {
        const date = new Date(item.timestamp);
        return `${index + 1}. "${item.message}"\n   ${date.toLocaleString()}`;
      })
      .join("\n\n");

    Alert.alert(
      `Reply History (${history.length} total)`,
      formatted + (history.length > 10 ? "\n\n...and more" : ""),
    );
  }

  async function clearHistory() {
    const result = await clearReplyHistory();
    Alert.alert("Clear History", JSON.stringify(result, null, 2));
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Auto-Reply Test</ThemedText>
        <HelloWave />
      </ThemedView>

      {status && (
        <ThemedView style={styles.statusContainer}>
          <ThemedText>{status}</ThemedText>
        </ThemedView>
      )}

      {notificationCount > 0 && (
        <ThemedView style={styles.statusContainer}>
          <ThemedText>Active notifications: {notificationCount}</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Permissions</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button
            title="Check Listener Permission"
            onPress={checkListenerPermission}
          />
          <Button
            title="Request Listener Permission"
            onPress={requestPermission}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Auto-Reply Control</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Check Status" onPress={checkAutoReplyStatus} />
          <Button title="Enable Auto-Reply" onPress={enableAutoReply} />
          <Button title="Disable Auto-Reply" onPress={disableAutoReply} />
          <Button title="Check Service Running" onPress={checkServiceStatus} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Reply Message</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Show Current Message" onPress={showCurrentMessage} />
          <Button title="Update Message" onPress={updateReplyMessage} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Allowed Apps</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Show Allowed Apps" onPress={showAllowedApps} />
          <Button title="Set WhatsApp Only" onPress={setWhatsAppOnly} />
          <Button title="Set Messaging Apps" onPress={setMessagingApps} />
          <Button title="Allow All Apps" onPress={allowAllApps} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Test Notifications (Emulator)</ThemedText>
        <ThemedText style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
          ⚠️ Note: Test notifications won't trigger auto-reply (Android
          limitation). Use real messaging apps for full testing.
        </ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Send Test Message" onPress={sendTestMessage} />
          <Button
            title="Send Multiple Test Messages"
            onPress={sendMultipleTests}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Notifications</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button
            title="Show Active Notifications"
            onPress={showActiveNotifications}
          />
          <Button
            title="Show First Notification Details"
            onPress={showNotificationDetails}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Reply History</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="View Reply History" onPress={viewReplyHistory} />
          <Button title="Clear History" onPress={clearHistory} />
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusContainer: {
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionContainer: {
    gap: 8,
    marginBottom: 24,
  },
  buttonGroup: {
    gap: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
