import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';

type ButtonType = 'google' | 'email' | 'phone';

interface ContinueWithSocialsProps {
  buttons?: ButtonType[];
  onGooglePress?: () => void;
  onEmailPress?: () => void;
  onPhonePress?: () => void;
}

export function ContinueWithSocials({
  buttons = ['google', 'email'],
  onGooglePress,
  onEmailPress,
  onPhonePress,
}: ContinueWithSocialsProps) {
  const buttonConfig = {
    google: {
      icon: 'logo-google' as const,
      text: 'Continue with Google',
      filled: false,
      onPress: onGooglePress,
    },
    email: {
      icon: 'mail' as const,
      text: 'Continue with Email',
      filled: true,
      onPress: onEmailPress,
    },
    phone: {
      icon: 'call' as const,
      text: 'Continue with Phone',
      filled: true,
      onPress: onPhonePress,
    },
  };

  return (
    <View style={styles.container}>
      {buttons.map((buttonType) => {
        const config = buttonConfig[buttonType];
        return (
          <TouchableOpacity
            key={buttonType}
            style={[styles.button, config.filled && styles.filledButton]}
            accessibilityRole="button"
            onPress={config.onPress}
          >
            <Ionicons
              name={config.icon}
              size={20}
              color={config.filled ? COLORS.cardBg : COLORS.textPrimary}
              style={styles.icon}
            />
            <Text style={[styles.buttonText, config.filled && { color: COLORS.cardBg }]}>
              {config.text}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'column', gap: 12, marginBottom: 20 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.textPrimary,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  filledButton: { backgroundColor: COLORS.textPrimary },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  icon: {
    marginRight: 8,
  },
});
