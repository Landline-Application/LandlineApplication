import React from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import { getCountryFlagEmoji } from "@/utils/phone-number";
import { COLORS } from "@/constants/colors";

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  detectedCountry: string; // "US", "CA", etc.
  isValid: boolean; // Controls the border color highlight
  isLoading?: boolean;
}

export function PhoneInput({
  value,
  onChangeText,
  detectedCountry,
  isValid,
  isLoading = false,
}: PhoneInputProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>MOBILE NUMBER</Text>

      <View style={[styles.wrapper, isValid && styles.wrapperActive]}>
        <Text style={styles.flag}>{getCountryFlagEmoji(detectedCountry)}</Text>

        <Text style={styles.plus}>+</Text>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="2133734253"
          placeholderTextColor={COLORS.placeholder}
          keyboardType="phone-pad"
          autoComplete="tel"
          editable={!isLoading}
          accessibilityLabel="Phone Number Input"
        />
      </View>

      <Text style={styles.disclaimer}>
        We&apos;ll call or text you to confirm your number. Standard message and
        data rates may apply.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 12,
    height: 54,
  },
  wrapperActive: {
    borderColor: COLORS.activeBorder,
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  plus: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: "600",
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    height: "100%",
  },
  disclaimer: {
    fontSize: 10,
    color: "#7a6a4a",
    marginTop: 6,
    fontStyle: "italic",
  },
});
