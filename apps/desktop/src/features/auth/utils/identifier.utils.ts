/**
 * Pure utility functions for user identifier classification, validation, masking, and channel routing.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS_REGEX = /^[0-9+\-\s]{8,15}$/;

/**
 * Checks if the given string represents an email address.
 */
export function isEmailIdentifier(value: string): boolean {
  return value.includes('@');
}

/**
 * Checks if the given string resembles a telephone number.
 */
export function isPhoneIdentifier(value: string): boolean {
  if (isEmailIdentifier(value)) {
    return false;
  }
  const clean = value.replace(/\s+/g, '');
  return value.startsWith('+') || /^\d+$/.test(clean);
}

/**
 * Validates whether the trimmed identifier satisfies email or telephone syntax.
 */
export function isValidIdentifier(value: string): boolean {
  const clean = value.trim();
  if (!clean) return false;
  return EMAIL_REGEX.test(clean) || PHONE_CHARS_REGEX.test(clean);
}

/**
 * Resolves whether communications should dispatch via email or WhatsApp based on identifier format.
 */
export function determineAuthChannel(identifier: string): 'email' | 'whatsapp' {
  return isEmailIdentifier(identifier) ? 'email' : 'whatsapp';
}

/**
 * Masks an identifier for secure display on OTP verification screens.
 */
export function maskIdentifier(value: string): string {
  if (value.includes('@')) {
    const [name, domain] = value.split('@');
    const maskedName =
      name.length > 2
        ? `${name[0]}${'•'.repeat(Math.min(name.length - 2, 5))}${name.slice(-1)}`
        : `${name[0]}•`;
    return `${maskedName}@${domain}`;
  }

  const clean = value.replace(/\s+/g, '');
  if (clean.length > 6) {
    return `${clean.slice(0, 4)} •• •• ${clean.slice(-2)}`;
  }
  return value;
}
