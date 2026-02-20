import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { FormLayout } from '@/components/ui/form-layout';
import { Button } from '@/components/ui/form/button';
import { RolodexCard } from '@/components/ui/roledex-card';
import { COLORS } from '@/constants/colors';
import { getPhoneConfirmation, setPhoneConfirmation } from '@/utils/firebase';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyPhoneScreen() {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN_SECONDS);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = useCallback(
    (text: string, index: number) => {
      const digit = text.replace(/\D/g, '').slice(-1);
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newCode.every((d) => d !== '') && digit) {
        handleSubmit(newCode.join(''));
      }
    },
    [code],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code],
  );

  const handleSubmit = async (verificationCode?: string) => {
    const finalCode = verificationCode || code.join('');
    if (finalCode.length !== CODE_LENGTH) {
      Alert.alert('Invalid Code', 'Please enter the full 6-digit code.');
      return;
    }

    const confirmation = getPhoneConfirmation();
    if (!confirmation) {
      Alert.alert('Session Expired', 'Please go back and request a new code.');
      return;
    }

    setIsLoading(true);
    try {
      await confirmation.confirm(finalCode);
      setPhoneConfirmation(null);
      router.replace('/(tabs)');
    } catch (error: any) {
      const errorCode = error?.code;
      if (errorCode === 'auth/invalid-verification-code') {
        Alert.alert('Wrong Code', 'The code you entered is incorrect. Please try again.');
      } else if (errorCode === 'auth/session-expired') {
        Alert.alert('Code Expired', 'The verification code has expired. Please request a new one.');
      } else {
        Alert.alert('Verification Failed', error?.message || 'An unexpected error occurred.');
      }
      setCode(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    Alert.alert('Resend Code', 'Please go back and submit your phone number again.', [
      { text: 'Go Back', onPress: () => router.back() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const codeString = code.join('');
  const isCodeComplete = codeString.length === CODE_LENGTH && code.every((d) => d !== '');

  return (
    <FormLayout>
      <RolodexCard title="VERIFY">
        <View style={styles.cardWrapper}>
          <Text style={styles.brandText}>Landline</Text>
          <Text style={styles.headerSubtitle}>Enter verification code</Text>
        </View>

        <Text style={styles.instruction}>
          We sent a 6-digit code to your phone number. Enter it below to verify your account.
        </Text>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isLoading}
              accessibilityLabel={`Digit ${index + 1} of verification code`}
            />
          ))}
        </View>

        <Button
          onPress={() => handleSubmit()}
          disabled={!isCodeComplete || isLoading}
          loading={isLoading}
          variant="primary"
        >
          VERIFY
        </Button>

        <View style={styles.resendContainer}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>Resend code in {resendTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={isLoading}>
              <Text style={styles.resendLink}>Didn&apos;t receive a code? Resend</Text>
            </TouchableOpacity>
          )}
        </View>
      </RolodexCard>

      <Button onPress={() => router.back()} variant="text">
        Go Back
      </Button>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  instruction: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeInput: {
    width: 44,
    height: 54,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.inputBg,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeInputFilled: {
    borderColor: COLORS.activeBorder,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendTimer: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resendLink: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
