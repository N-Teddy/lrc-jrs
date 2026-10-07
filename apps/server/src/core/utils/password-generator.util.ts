import * as crypto from 'node:crypto';

export const PasswordGeneratorUtil = {
  /**
   * Generates a cryptographically strong, human-readable temporary password.
   * Example: "JRS-8xK4#mQ2"
   */
  generateTemporaryPassword(length = 10): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    const bytes = crypto.randomBytes(length);
    let result = '';

    for (let i = 0; i < length; i++) {
      const byte = bytes[i];
      if (byte !== undefined) {
        result += chars[byte % chars.length];
      }
    }

    return `JRS-${result}`;
  },

  /**
   * Generates a 6-digit numeric OTP code.
   * Example: "849201"
   */
  generateNumericOtp(): string {
    const min = 100000;
    const max = 999999;
    return String(crypto.randomInt(min, max + 1));
  },
};
