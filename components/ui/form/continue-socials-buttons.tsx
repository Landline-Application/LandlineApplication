import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { COLORS } from '@/constants/theme';
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
              color={config.filled ? COLORS.surface.card : COLORS.text.primary}
              style={styles.icon}
            />
            <Text style={[styles.buttonText, config.filled && { color: COLORS.surface.card }]}>
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
    borderColor: COLORS.text.primary,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  filledButton: { backgroundColor: COLORS.text.primary },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  icon: {
    marginRight: 8,
  },
});
