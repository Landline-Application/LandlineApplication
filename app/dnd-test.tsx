import { Image } from "expo-image";
import { Alert, Button, StyleSheet } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useState } from "react";

import {
  getAllInstalledApps,
  getAppNotificationStatus,
  getCurrentState,
  getInterruptionFilterConstants,
  hasPermission,
  openAppNotificationSettings,
  requestPermission,
  setDNDEnabled,
  setInterruptionFilter,
} from "@/modules/dnd-manager";

export default function DNDTestScreen() {
  const [dndStatus, setDndStatus] = useState("");
  const [appCount, setAppCount] = useState(0);

  async function checkPermission() {
    const hasPerms = hasPermission();
    Alert.alert("DND Permission", `Has permission: ${hasPerms}`);
  }

  async function requestPermissions() {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert("Success", "DND permission already granted!");
    } else {
      Alert.alert("Action Required", "Please grant DND permission in settings");
    }
  }

  async function checkCurrentState() {
    const state = getCurrentState();
    setDndStatus(`State: ${state.message} (${state.currentState})`);
    Alert.alert("Current DND State", JSON.stringify(state, null, 2));
  }

  async function turnOnDND() {
    const result = await setDNDEnabled(true);
    Alert.alert("Enable DND", JSON.stringify(result, null, 2));
  }

  async function turnOffDND() {
    const result = await setDNDEnabled(false);
    Alert.alert("Disable DND", JSON.stringify(result, null, 2));
  }

  async function setPriorityMode() {
    const constants = getInterruptionFilterConstants();
    const result = await setInterruptionFilter(constants.PRIORITY);
    Alert.alert("Priority Mode", JSON.stringify(result, null, 2));
  }

  async function setAlarmsMode() {
    const constants = getInterruptionFilterConstants();
    const result = await setInterruptionFilter(constants.ALARMS);
    Alert.alert("Alarms Mode", JSON.stringify(result, null, 2));
  }

  async function setNormalMode() {
    const constants = getInterruptionFilterConstants();
    const result = await setInterruptionFilter(constants.ALL);
    Alert.alert("Normal Mode", JSON.stringify(result, null, 2));
  }

  async function getInstalledApps() {
    const apps = await getAllInstalledApps(false);
    setAppCount(apps.length);
    Alert.alert(
      "Installed Apps",
      `Found ${apps.length} apps\n\nFirst 3:\n${apps.slice(0, 3).map((a) => `${a.appName} - ${a.notificationsEnabled ? "✓" : "✗"}`).join("\n")}`
    );
  }

  async function getInstalledAppsWithSystem() {
    const apps = await getAllInstalledApps(true);
    setAppCount(apps.length);
    Alert.alert(
      "All Apps (including system)",
      `Found ${apps.length} apps\n\nFirst 3:\n${apps.slice(0, 3).map((a) => `${a.appName} - ${a.notificationsEnabled ? "✓" : "✗"}`).join("\n")}`
    );
  }

  async function checkAppStatus() {
    const packageName = "com.android.chrome";
    const status = await getAppNotificationStatus(packageName);
    Alert.alert(
      "Chrome Notification Status",
      JSON.stringify(status, null, 2)
    );
  }

  async function openChromeSettings() {
    const packageName = "com.android.chrome";
    const opened = await openAppNotificationSettings(packageName);
    Alert.alert("Settings", opened ? "Opened successfully" : "Failed to open");
  }

  async function showFilterConstants() {
    const constants = getInterruptionFilterConstants();
    Alert.alert("Filter Constants", JSON.stringify(constants, null, 2));
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
        <ThemedText type="title">DND Manager Test</ThemedText>
        <HelloWave />
      </ThemedView>

      {dndStatus && (
        <ThemedView style={styles.statusContainer}>
          <ThemedText>{dndStatus}</ThemedText>
        </ThemedView>
      )}

      {appCount > 0 && (
        <ThemedView style={styles.statusContainer}>
          <ThemedText>Apps found: {appCount}</ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Permissions</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Check Permission" onPress={checkPermission} />
          <Button title="Request Permission" onPress={requestPermissions} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">DND State</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Get Current State" onPress={checkCurrentState} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">DND Control</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Enable DND (Total Silence)" onPress={turnOnDND} />
          <Button title="Disable DND" onPress={turnOffDND} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Interruption Filters</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Set Priority Mode" onPress={setPriorityMode} />
          <Button title="Set Alarms Only" onPress={setAlarmsMode} />
          <Button title="Set Normal Mode" onPress={setNormalMode} />
          <Button title="Show Filter Constants" onPress={showFilterConstants} />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">App Notifications</ThemedText>
        <ThemedView style={styles.buttonGroup}>
          <Button title="Get User Apps" onPress={getInstalledApps} />
          <Button
            title="Get All Apps (+ System)"
            onPress={getInstalledAppsWithSystem}
          />
          <Button
            title="Check Chrome Status"
            onPress={checkAppStatus}
          />
          <Button
            title="Open Chrome Settings"
            onPress={openChromeSettings}
          />
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
