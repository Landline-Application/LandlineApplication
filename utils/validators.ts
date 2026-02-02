export const validateEmail = (value: string): string => {
  if (!value) {
    return "Email is required";
  }

  // Improved regex to ensure there's a character after the dot in the domain
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(value)) {
    return "Please enter a valid email";
  }

  return "";
};

/**
 * Validates a password based on the criteria below:
 *
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numerical digit (0-9)
 * - At least one special character (e.g., !@#$%^&*)
 *
 * @param value - Password
 * @returns An empty string if valid, or an error message.
 */
export const validatePassword = (value: string): string => {
  if (!value) {
    return "Password is required.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters long.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/\d/.test(value)) {
    return "Password must contain at least one number.";
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    return "Password must contain at least one special character.";
  }

  return "";
};
