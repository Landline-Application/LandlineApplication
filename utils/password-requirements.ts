/** Landline sign-up password rules (LLA-141). */

export const PASSWORD_MIN_LENGTH = 8;

/** Letters and numbers only — anything else counts as “special” for UX. */
export function passwordHasSpecialCharacter(password: string): boolean {
  return /[^A-Za-z0-9]/.test(password);
}

export function passwordMeetsLength(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

export function isSignupPasswordValid(password: string): boolean {
  return passwordMeetsLength(password) && passwordHasSpecialCharacter(password);
}

export interface PasswordRequirement {
  id: 'length' | 'special';
  label: string;
  met: boolean;
}

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: passwordMeetsLength(password),
    },
    {
      id: 'special',
      label: 'At least 1 special character (e.g. ! @ # $ %)',
      met: passwordHasSpecialCharacter(password),
    },
  ];
}
