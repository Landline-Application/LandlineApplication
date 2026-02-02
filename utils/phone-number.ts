import { CountryCode, parsePhoneNumberWithError } from 'libphonenumber-js';

export const getCountryFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * Get the country code from a phone number string
 * @param phoneNumber - Phone number with or without + prefix
 * @returns Country code (e.g., "US", "GB") or default country
 */
export const getCountryCodeFromNumber = (
  phoneNumber: string,
  defaultCountry: CountryCode = 'US',
): CountryCode => {
  try {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length === 0) {
      return defaultCountry;
    }

    // Add + if not present for parsing
    const numberToParse = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const parsed = parsePhoneNumberWithError(numberToParse, defaultCountry);

    return parsed?.country || defaultCountry;
  } catch {
    return defaultCountry;
  }
};

/**
 * Validate if a phone number is valid
 * @param phoneNumber - Phone number to validate
 * @param country - Country code to validate against
 * @returns true if valid, false otherwise
 */
export const validatePhoneNumber = (phoneNumber: string, country?: CountryCode): boolean => {
  try {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length === 0) {
      return false;
    }

    const numberToParse = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const parsed = parsePhoneNumberWithError(numberToParse, country);

    return parsed?.isValid() || false;
  } catch {
    return false;
  }
};
