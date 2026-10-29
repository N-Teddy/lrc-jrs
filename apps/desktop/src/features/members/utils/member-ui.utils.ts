import type { UserRole } from '@jrs/shared';

export function calculateAge(
  dob: string | Date | undefined | null,
): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export type AgeCategory = 'UNDERAGE' | 'ELIGIBLE_JR' | 'SENIOR' | 'UNKNOWN';

export function getAgeCategory(age: number | null): AgeCategory {
  if (age === null) return 'UNKNOWN';
  if (age < 18) return 'UNDERAGE';
  if (age <= 30) return 'ELIGIBLE_JR';
  return 'SENIOR';
}

export function extractCameroonLocalDigits(
  val: string | undefined | null,
): string {
  if (!val) return '';
  let digits = val.replace(/\D/g, '');

  // Strip international prefix (00237 or 237)
  if (digits.startsWith('00237')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('237')) {
    digits = digits.slice(3);
  }

  return digits.slice(0, 9);
}

export function formatCameroonPhone(
  phone: string | undefined | null,
  options?: { includeCountryCode?: boolean },
): string {
  if (!phone) return '';
  const localDigits = extractCameroonLocalDigits(phone);

  if (localDigits.length === 9) {
    const formatted = `${localDigits.slice(0, 3)} ${localDigits.slice(3, 5)} ${localDigits.slice(5, 7)} ${localDigits.slice(7, 9)}`;
    return options?.includeCountryCode ? `+237 ${formatted}` : formatted;
  }
  return phone;
}

export function formatCameroonPhoneInput(
  val: string | undefined | null,
): string {
  if (!val) return '';
  const localDigits = extractCameroonLocalDigits(val);
  if (localDigits.length <= 3) return localDigits;
  if (localDigits.length <= 5)
    return `${localDigits.slice(0, 3)} ${localDigits.slice(3)}`;
  if (localDigits.length <= 7)
    return `${localDigits.slice(0, 3)} ${localDigits.slice(3, 5)} ${localDigits.slice(5)}`;
  return `${localDigits.slice(0, 3)} ${localDigits.slice(3, 5)} ${localDigits.slice(5, 7)} ${localDigits.slice(7, 9)}`;
}

export function getCleanDigitsForWhatsApp(
  phone: string | undefined | null,
): string {
  if (!phone) return '';
  const localDigits = extractCameroonLocalDigits(phone);
  if (localDigits.length === 9) {
    return `237${localDigits}`;
  }
  return phone.replace(/\D/g, '');
}

// fallow-ignore-next-line unused-export
export function getInitials(name: string | undefined | null): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getRoleDisplayInfo(role: UserRole | string | undefined) {
  switch (role) {
    case 'AP':
      return {
        label: 'AP',
        shortLabel: 'AP',
        badgeBg: 'bg-[#ffdad4]',
        badgeText: 'text-[#881f14]',
        border: 'border-[#ffb4a8]',
      };
    case 'PC':
      return {
        label: 'PC',
        shortLabel: 'PC',
        badgeBg: 'bg-[#ffdbcf]',
        badgeText: 'text-[#812901]',
        border: 'border-[#ffb59c]',
      };
    default:
      return {
        label: 'JR Member',
        shortLabel: 'Member',
        badgeBg: 'bg-[#f4ece9]',
        badgeText: 'text-[#57423b]',
        border: 'border-[#e8e1dd]',
      };
  }
}
