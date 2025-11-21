import { Image } from "expo-image";
import { Link, router } from "expo-router";
import { Alert, Button, Platform, StyleSheet, View } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

import { useAuth } from "@/contexts/auth-context";
import { useCallback, useEffect } from "react";

import {
    getCurrentState,
    hasPermission,
    requestPermission,
    setDNDEnabled,
} from "@/modules/dnd-manager";

import Notif from "@/modules/notification-api-manager";
import { clearAcceptance } from "@/utils/acceptance-storage";

export default function HomeScreen() {
  const { user, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    async function fetchDNDSettings() {
      const permissions = hasPermission();
      console.log("DND Permissions: ", permissions);

      const dndState = getCurrentState();
      console.log("Current DND State: ", dndState);
    }

    fetchDNDSettings();

    setDNDEnabled(true).then((result) => {
      console.log("Set DND Result: ", result);
    });
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/onboarding');
          },
        },
      ]
    );
  };

  // ------------ Notifications demo --------------
  const requestNotifPermissions = useCallback(async () => {
    const already = Notif.hasPostPermission();
    if (already) {
      console.log("Notification permission already granted");
      return;
    }
    console.log("Opening notification settings…");
    Notif.openNotificationSettings();

    // optional: check again a bit later
    setTimeout(() => {
      console.log("Permission after settings:", Notif.hasPostPermission());
    }, 2000);
  }, []);

  // Send a test notification
  const sendTestNotification = useCallback(() => {
    if (!Notif.hasPostPermission()) {
      Alert.alert("Enable notifications first");
      return;
    }
    // IMPORTANCE_DEFAULT = 3
    Notif.createChannel("demo", "Demo", 3);
    const id = Date.now() % 100000;
    Notif.notify("Hello", "It works!", "demo", id);
  }, []);
  // ------------------------------------------------

  async function requestPermissions() {
    const permissionGranted = await requestPermission();

    if (permissionGranted) {
      // Permission was already granted
      console.log("DND permission already granted!");
    } else {
      // Settings screen was opened, need to check again later
      console.log(
        "Please grant DND permission in the settings that just opened",
      );

      // Later, manually check again:
      setTimeout(() => {
        const nowHasPermission = hasPermission();
        if (nowHasPermission) {
          console.log("Permission granted!");
        } else {
          console.log("Permission not granted");
        }
      }, 3000);
    }
  }

  function turnOnDND() {
    const dndState = getCurrentState();
    console.log("Current DND State before turn on: ", dndState);

    setDNDEnabled(true).then((result) => {
      console.log("Set DND Result: ", result);
    });
  }

  async function resetTermsAcceptance() {
    try {
      await clearAcceptance();
      Alert.alert(
        "Success",
        "Terms acceptance cleared. App will now redirect to terms screen.",
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to terms screen to restart the flow
              router.replace('/terms-and-privacy' as any);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to clear acceptance. Please try again.");
      console.error("Error clearing acceptance:", error);
    }
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
        {/* Authentication Status */}
        <ThemedView style={styles.stepContainer}>
          <ThemedText type="subtitle">👤 Account Status</ThemedText>
          {isAuthenticated ? (
            <View style={{ gap: 8 }}>
              <ThemedText>
                ✅ Signed in as: <ThemedText type="defaultSemiBold">{user?.email}</ThemedText>
              </ThemedText>
              <Button title="Sign Out" onPress={handleSignOut} color="#f5576c" />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <ThemedText>❌ Not signed in</ThemedText>
              <Button 
                title="🎉 View Onboarding / Sign Up" 
                onPress={() => router.push('/onboarding')} 
              />
            </View>
          )}
        </ThemedView>

        {/* Testing button */}
        <ThemedView style={styles.stepContainer}>
          <Button 
            title="🔄 Reset Terms Acceptance (Testing)" 
            onPress={resetTermsAcceptance}
            color="#ff6b6b"
          />
        </ThemedView>

        {/* DND buttons */}
      <Button title="Request DND Permissions" onPress={requestPermissions} />
      <Button title="Turn on DND" onPress={turnOnDND} />

      {/* Notification buttons */}
      <Button
        title="Request Notification Permission"
        onPress={requestNotifPermissions}
      />
      <Button title="Send Test Notification" onPress={sendTestNotification} />

      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction
              title="Action"
              icon="cube"
              onPress={() => alert("Action pressed")}
            />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert("Share pressed")}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert("Delete pressed")}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">
            npm run reset-project
          </ThemedText>{" "}
          to get a fresh <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
          directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
