import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ColorValue,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PRIVACY_POLICY, TERMS_OF_USE } from "@/constants/legal-content";
import { saveTermsAcceptance } from "@/utils/acceptance-storage";

type TabType = "terms" | "privacy";

export default function TermsAndPrivacyScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("terms");
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !hasScrolledToEnd) {
      setHasScrolledToEnd(true);
    }
  };

  const handleAccept = async () => {
    if (!agreedToTerms || !hasScrolledToEnd) return;

    setIsLoading(true);
    try {
      await saveTermsAcceptance();
      // Navigate to onboarding after acceptance
      router.replace("/onboarding");
    } catch (error) {
      console.error("Error saving acceptance:", error);
      alert("Failed to save your acceptance. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const isAcceptButtonEnabled = agreedToTerms && hasScrolledToEnd;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={["#667eea", "#764ba2"] as [ColorValue, ColorValue]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📋</Text>
          </View>
          <Text style={styles.headerTitle}>Legal Agreement</Text>
          <Text style={styles.headerSubtitle}>
            Please review and accept our terms to continue
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "terms" && styles.activeTab]}
            onPress={() => {
              setActiveTab("terms");
              setHasScrolledToEnd(false);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "terms" && styles.activeTabText,
              ]}
            >
              Terms of Use
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "privacy" && styles.activeTab]}
            onPress={() => {
              setActiveTab("privacy");
              setHasScrolledToEnd(false);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "privacy" && styles.activeTabText,
              ]}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.contentText}>
              {activeTab === "terms" ? TERMS_OF_USE : PRIVACY_POLICY}
            </Text>
            <View style={styles.endIndicator}>
              <Text style={styles.endIndicatorText}>
                ✓ You&apos;ve reached the end
              </Text>
            </View>
          </ScrollView>

          {!hasScrolledToEnd && (
            <View style={styles.scrollPrompt}>
              <Text style={styles.scrollPromptText}>
                ↓ Scroll to read all content
              </Text>
            </View>
          )}
        </View>

        {/* Agreement Checkbox */}
        <View style={styles.agreementContainer}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
            >
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.agreementText}>
              I have read and agree to the Terms of Use and Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            styles.acceptButton,
            !isAcceptButtonEnabled && styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={!isAcceptButtonEnabled || isLoading}
        >
          <LinearGradient
            colors={
              isAcceptButtonEnabled
                ? (["#43e97b", "#38f9d7"] as [ColorValue, ColorValue])
                : (["#666", "#888"] as [ColorValue, ColorValue])
            }
            style={styles.acceptButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.acceptButtonText}>
              {isLoading ? "Saving..." : "Accept & Continue"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Requirement hint */}
        {!isAcceptButtonEnabled && (
          <Text style={styles.hintText}>
            {!hasScrolledToEnd
              ? "Please scroll to the end of the document"
              : "Please check the agreement box"}
          </Text>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  gradient: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.7)",
  },
  activeTabText: {
    color: "#fff",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: "relative",
  },
  scrollView: {
    flex: 1,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
    marginBottom: 20,
  },
  endIndicator: {
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 2,
    borderTopColor: "#43e97b",
    marginTop: 10,
  },
  endIndicatorText: {
    color: "#43e97b",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollPrompt: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "rgba(102, 126, 234, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  scrollPromptText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  agreementContainer: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: "#43e97b",
    borderColor: "#43e97b",
  },
  checkmark: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  agreementText: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    lineHeight: 20,
  },
  acceptButton: {
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  hintText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 16,
    fontStyle: "italic",
  },
});
