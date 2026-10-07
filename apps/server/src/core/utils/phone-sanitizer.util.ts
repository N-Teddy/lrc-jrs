export const PhoneSanitizer = {
  /**
   * Normalizes a phone number into international digits without '+' or symbols.
   * Examples:
   *   "+237 693 08 71 59" -> "237693087159"
   *   "693087159" (9 digits starting with 6 or 2) -> "237693087159"
   *   "00237693087159" -> "237693087159"
   */
  toInternationalDigits(input: string): string {
    if (!input) return '';
    let digits = input.replace(/\D/g, '');

    // Strip leading 00
    if (digits.startsWith('00')) {
      digits = digits.slice(2);
    }

    // Cameroon 9 digits (starts with 6 or 2)
    if (
      digits.length === 9 &&
      (digits.startsWith('6') || digits.startsWith('2'))
    ) {
      digits = `237${digits}`;
    }

    return digits;
  },

  /**
   * Masks a phone number for privacy display (e.g. "237••••••159").
   */
  maskPhoneNumber(phone: string): string {
    const sanitized = PhoneSanitizer.toInternationalDigits(phone);
    if (sanitized.length <= 6) return sanitized;
    const start = sanitized.slice(0, 3);
    const end = sanitized.slice(-3);
    return `${start}••••••${end}`;
  },
};
