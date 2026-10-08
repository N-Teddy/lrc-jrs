/**
 * Pure utility functions for dashboard formatting and user presentation.
 */

/**
 * Generates up to two uppercase initials from a user's full name.
 */
export function getUserInitials(fullName?: string): string {
  if (!fullName?.trim()) {
    return 'JR';
  }

  return fullName
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Formats a Date object into a readable dashboard date (e.g. "Wed, Oct 8, 2026" or "mer. 8 oct. 2026").
 */
export function formatDashboardDate(
  date: Date = new Date(),
  locale = 'fr',
): string {
  const intlLocale = locale?.startsWith('fr') ? 'fr-FR' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
