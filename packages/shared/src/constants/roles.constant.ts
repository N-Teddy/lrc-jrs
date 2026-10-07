export enum UserRole {
  AP = 'AP', // Animateur Principal / Overseer (> 30 years old, mentor)
  PC = 'PC', // Personne Contact (JR member, 18-30 years old, max 2 active per town)
  MEMBER = 'MEMBER', // Standard JR Member (18-30 years old)
}

export const JR_AGE_RANGE = {
  MIN: 18,
  MAX: 30,
} as const;

export function isJrAgeEligible(dateOfBirth: Date | string): boolean {
  const dob =
    typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age >= JR_AGE_RANGE.MIN && age <= JR_AGE_RANGE.MAX;
}

export function calculateAge(dateOfBirth: Date | string): number {
  const dob =
    typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}
