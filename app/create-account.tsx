import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { COLORS } from "@/constants/colors";
import { usePhoneAuth } from "@/hooks/use-phone-auth";
import { RolodexCard } from "@/components/ui/roledex-card";
import { FormLayout } from "@/components/ui/form-layout";
import { PhoneInput } from "@/components/ui/form/phone-number";
import { ContinueWithSocials } from "@/components/ui/form/continue-socials-buttons";
import { Button } from "@/components/ui/form/button";

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

        <Button
          onPress={submitPhone}
          disabled={!isFormValid || isLoading}
          loading={isLoading}
          variant="primary"
        >
          CONTINUE
        </Button>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <ContinueWithSocials
          buttons={["google", "email"]}
          onGooglePress={() => console.log("Google sign up")}
          onEmailPress={() => router.push("/create-account-email")}
        />

        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Button
            onPress={() => router.push("/login")}
            variant="text"
          >
            Already have an account?
          </Button>
        </View>
      </RolodexCard>

      <Button
        onPress={() => router.replace("/(tabs)")}
        variant="text"
      >
        Skip
      </Button>
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
});
