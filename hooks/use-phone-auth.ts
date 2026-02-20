import { useCallback, useMemo, useState } from 'react';

import { Alert } from 'react-native';

import { router } from 'expo-router';

import { getCountryCodeFromNumber, validatePhoneNumber } from '@/utils/phone-number';
import { auth, setPhoneConfirmation, signInWithPhoneNumber } from '@/utils/firebase';

interface UsePhoneAuthProps {
  initialValue?: string;
  onSuccess?: () => void;
}

interface UsePhoneAuthReturn {
  phoneInput: string;
  detectedCountry: string;
  isFormValid: boolean;
  isLoading: boolean;
  handlePhoneNumberChange: (text: string) => void;
  submitPhone: () => Promise<void>;
}

export function usePhoneAuth({ initialValue }: UsePhoneAuthProps): UsePhoneAuthReturn {
  const [phoneInput, setPhoneInput] = useState(initialValue ?? '1');
  const [isLoading, setIsLoading] = useState(false);

  const detectedCountry = useMemo(() => {
    const fullNumber = phoneInput ? `+${phoneInput}` : '+1';
    return getCountryCodeFromNumber(fullNumber, 'US');
  }, [phoneInput]);

  const isFormValid = useMemo(() => {
    const fullNumber = phoneInput ? `+${phoneInput}` : '';
    return validatePhoneNumber(fullNumber, detectedCountry);
  }, [phoneInput, detectedCountry]);

  const handlePhoneNumberChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, '');
    setPhoneInput(cleaned);
  }, []);

  const submitPhone = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert('Invalid Number', 'Please insert a valid phone number.');
      return;
    }

    setIsLoading(true);

    try {
      const formattedNumber = `+${phoneInput}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedNumber);
      setPhoneConfirmation(confirmation);
      router.push('/verify-phone');
    } catch (error: any) {
      const code = error?.code;
      if (code === 'auth/invalid-phone-number') {
        Alert.alert('Invalid Number', 'The phone number format is not valid.');
      } else if (code === 'auth/too-many-requests') {
        Alert.alert('Too Many Attempts', 'You have been rate limited. Please try again later.');
      } else if (code === 'auth/quota-exceeded') {
        Alert.alert('SMS Quota Exceeded', 'The SMS verification quota has been exceeded. Please try again later.');
      } else {
        Alert.alert('Error', error?.message || 'Failed to send verification code. Please try again.');
      }
      console.error('Phone auth error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, phoneInput]);

  return {
    phoneInput,
    detectedCountry,
    isFormValid,
    isLoading,
    handlePhoneNumberChange,
    submitPhone,
  };
}
