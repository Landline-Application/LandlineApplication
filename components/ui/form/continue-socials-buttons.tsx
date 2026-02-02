import { COLORS } from "@/constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";

export function ContinueWithSocials() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} accessibilityRole="button">
        <Ionicons
          name="logo-google"
          size={20}
          color={COLORS.textPrimary}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Continue with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.emailButton]}
        accessibilityRole="button"
      >
        <Ionicons
          name="mail"
          size={20}
          color={COLORS.cardBg}
          style={styles.icon}
        />
        <Text style={[styles.buttonText, { color: COLORS.cardBg }]}>
          Continue with Email
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "column", gap: 12, marginBottom: 20 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  emailButton: { backgroundColor: COLORS.textPrimary },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  icon: {
    marginRight: 8,
  },
});
