import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { usePhoneAuth } from "@/hooks/use-phone-auth";
import { RolodexCard } from "@/components/ui/roledex-card";
import { FormLayout } from "@/components/ui/form-layout";
import { PhoneInput } from "@/components/ui/form/phone-number";
import { ContinueWithSocials } from "@/components/ui/form/continue-socials-buttons";

export default function CreateAccountPage() {
  const {
    detectedCountry,
    phoneInput,
    isLoading,
    isFormValid,
    handlePhoneNumberChange,
    submitPhone,
  } = usePhoneAuth({
    onSuccess: () => router.replace("/(tabs)"),
  });

  return (
    <FormLayout>
      <RolodexCard title="LANDLINE">
        <View style={styles.cardWrapper}>
          <Text style={styles.brandText}>Landline</Text>
          <Text style={styles.headerSubtitle}>
            Stay connected, stay present
          </Text>
        </View>

        <PhoneInput
          value={phoneInput}
          onChangeText={handlePhoneNumberChange}
          detectedCountry={detectedCountry}
          isValid={isFormValid}
        />

        <TouchableOpacity
          style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={submitPhone}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.cardBg} />
          ) : (
            <Text style={styles.primaryButtonText}>CONTINUE</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <ContinueWithSocials />

        {/* Login Link */}
        <TouchableOpacity
          onPress={() => router.push("/login")}
          style={styles.loginLinkContainer}
        >
          <Text style={styles.loginLinkText}>Already have an account?</Text>
        </TouchableOpacity>
      </RolodexCard>

      <TouchableOpacity
        style={styles.skipButton}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  brandText: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // --- Buttons ---
  primaryButton: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.cardBg,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
  },

  // Divider Section
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.cardBorder,
    opacity: 0.6,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },

  loginLinkContainer: {
    alignItems: "center",
  },
  loginLinkText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.8,
  },

  // --- Skip ---
  skipButton: {
    alignItems: "center",
    marginTop: 10,
    padding: 10,
  },
  skipText: {
    color: COLORS.tabBg,
    fontSize: 15,
    fontWeight: "500",
    opacity: 0.8,
  },
});
