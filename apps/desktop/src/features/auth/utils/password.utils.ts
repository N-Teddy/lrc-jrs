/**
 * Pure utility functions for password validation rules and password strength analysis.
 */

export interface PasswordRule {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordStrength {
  percent: number;
  label: string;
  colorClass: string;
}

/**
 * Validates account password criteria: length, casing, and number/symbol.
 */
export function validatePasswordRules(password: string): PasswordRule[] {
  return [
    {
      id: 'length',
      label: 'At least 8 characters long',
      met: password.length >= 8,
    },
    {
      id: 'casing',
      label: 'Contains both uppercase & lowercase letters',
      met: /[a-z]/.test(password) && /[A-Z]/.test(password),
    },
    {
      id: 'numberOrSpecial',
      label: 'Contains at least one number or symbol',
      met: /[0-9!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];
}

/**
 * Computes a visual password strength score based on satisfied rules.
 */
export function calculatePasswordStrength(
  rules: PasswordRule[],
  passwordLength: number,
): PasswordStrength {
  if (passwordLength === 0) {
    return {
      percent: 0,
      label: 'Unchecked',
      colorClass: 'bg-[#8a726a]',
    };
  }

  const metCount = rules.filter((r) => r.met).length;

  if (metCount === 1) {
    return {
      percent: 33,
      label: 'Weak',
      colorClass: 'bg-[#ba1a1a]',
    };
  }

  if (metCount === 2) {
    return {
      percent: 66,
      label: 'Fair',
      colorClass: 'bg-[#b85028]',
    };
  }

  if (metCount === 3) {
    return {
      percent: 100,
      label: 'Strong',
      colorClass: 'bg-[#43664d]',
    };
  }

  return {
    percent: 0,
    label: 'Unchecked',
    colorClass: 'bg-[#8a726a]',
  };
}
