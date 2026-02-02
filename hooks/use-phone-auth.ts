import { useState, useMemo, useCallback } from "react";
import { Alert } from "react-native";
import {
  getCountryCodeFromNumber,
  validatePhoneNumber,
} from "@/utils/phone-number";

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

export function usePhoneAuth({
  initialValue,
  onSuccess,
}: UsePhoneAuthProps): UsePhoneAuthReturn {
  const [phoneInput, setPhoneInput] = useState(initialValue ?? "1");
  const [isLoading, setIsLoading] = useState(false);

  const detectedCountry = useMemo(() => {
    const fullNumber = phoneInput ? `+${phoneInput}` : "+1";
    // Defaulting to US if detection fails
    return getCountryCodeFromNumber(fullNumber, "US");
  }, [phoneInput]);

  const isFormValid = useMemo(() => {
    const fullNumber = phoneInput ? `+${phoneInput}` : "";
    return validatePhoneNumber(fullNumber, detectedCountry);
  }, [phoneInput, detectedCountry]);

  const handlePhoneNumberChange = useCallback((text: string) => {
    const cleaned = text.replace(/\D/g, "");
    setPhoneInput(cleaned);
  }, []);

  const submitPhone = useCallback(async () => {
    if (!isFormValid) {
      Alert.alert("Invalid Number", "Please insert a valid phone number.");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to verify phone number. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [isFormValid, onSuccess]);

  return {
    phoneInput,
    detectedCountry,
    isFormValid,
    isLoading,
    handlePhoneNumberChange,
    submitPhone,
  };
}
