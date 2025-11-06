import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCEPTANCE_KEY = '@landline_terms_acceptance';
const TERMS_VERSION = '1.0.0';

export interface AcceptanceRecord {
  accepted: boolean;
  timestamp: string;
  version: string;
}

/**
 * Check if the user has accepted the terms and privacy policy
 */
export async function hasAcceptedTerms(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ACCEPTANCE_KEY);
    if (value !== null) {
      const record: AcceptanceRecord = JSON.parse(value);
      // Check if user accepted the current version
      return record.accepted && record.version === TERMS_VERSION;
    }
    return false;
  } catch (error) {
    console.error('Error checking terms acceptance:', error);
    return false;
  }
}

/**
 * Save the user's acceptance of terms and privacy policy
 */
export async function saveTermsAcceptance(): Promise<void> {
  try {
    const record: AcceptanceRecord = {
      accepted: true,
      timestamp: new Date().toISOString(),
      version: TERMS_VERSION,
    };
    await AsyncStorage.setItem(ACCEPTANCE_KEY, JSON.stringify(record));
  } catch (error) {
    console.error('Error saving terms acceptance:', error);
    throw error;
  }
}

/**
 * Get the acceptance record details
 */
export async function getAcceptanceRecord(): Promise<AcceptanceRecord | null> {
  try {
    const value = await AsyncStorage.getItem(ACCEPTANCE_KEY);
    if (value !== null) {
      return JSON.parse(value);
    }
    return null;
  } catch (error) {
    console.error('Error getting acceptance record:', error);
    return null;
  }
}

/**
 * Clear the acceptance record (for testing purposes)
 */
export async function clearAcceptance(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ACCEPTANCE_KEY);
  } catch (error) {
    console.error('Error clearing acceptance:', error);
    throw error;
  }
}
