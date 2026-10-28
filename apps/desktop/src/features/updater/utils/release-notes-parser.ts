import changelogData from '../data/changelog.json';

export interface ReleaseEntry {
  version: string;
  date?: string;
  releaseTitle?: string | { en?: string; fr?: string };
  features: string[] | { en?: string[]; fr?: string[] };
  fixes: string[] | { en?: string[]; fr?: string[] };
  general?: string[] | { en?: string[]; fr?: string[] };
}

export interface ParsedReleaseNotes {
  title?: string;
  date?: string;
  features: string[];
  fixes: string[];
  general: string[];
}

/**
 * Normalizes multi-language or string array into a string array for the active language.
 */
function resolveListForLanguage(
  item?: string[] | { en?: string[]; fr?: string[] },
  lang = 'en',
): string[] {
  if (!item) return [];
  if (Array.isArray(item)) return item;
  const isFrench = lang.toLowerCase().startsWith('fr');
  if (isFrench && item.fr && item.fr.length > 0) return item.fr;
  return item.en || item.fr || [];
}

function resolveTitleForLanguage(
  title?: string | { en?: string; fr?: string },
  lang = 'en',
): string | undefined {
  if (!title) return undefined;
  if (typeof title === 'string') return title;
  const isFrench = lang.toLowerCase().startsWith('fr');
  return isFrench ? title.fr || title.en : title.en || title.fr;
}

/**
 * Parses raw text or markdown release notes (e.g. from GitHub releases or Tauri updater)
 * into categorized features, bug fixes, and general notes.
 */
export function parseReleaseNotes(body?: string | null): ParsedReleaseNotes {
  if (!body || !body.trim()) {
    return { features: [], fixes: [], general: [] };
  }

  const features: string[] = [];
  const fixes: string[] = [];
  const general: string[] = [];

  const lines = body.split('\n');
  let currentSection: 'features' | 'fixes' | 'general' = 'general';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect markdown header or section titles
    const lower = line.toLowerCase();
    if (
      lower.startsWith('#') ||
      lower.endsWith(':') ||
      lower.startsWith('**features') ||
      lower.startsWith('**fixes')
    ) {
      if (
        lower.includes('feature') ||
        lower.includes("what's new") ||
        lower.includes('added') ||
        lower.includes('nouveauté')
      ) {
        currentSection = 'features';
        continue;
      }
      if (
        lower.includes('fix') ||
        lower.includes('bug') ||
        lower.includes('resolved') ||
        lower.includes('patch') ||
        lower.includes('correctif')
      ) {
        currentSection = 'fixes';
        continue;
      }
      if (
        lower.includes('other') ||
        lower.includes('change') ||
        lower.includes('improvement') ||
        lower.includes('amélioration')
      ) {
        currentSection = 'general';
        continue;
      }
    }

    // Clean up bullet point formatting (- , * , •, numbers)
    const cleaned = line
      .replace(/^[-*•]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim();

    if (!cleaned) continue;

    // If commit-style prefix
    if (/^feat(\(.*?\))?:\s*/i.test(cleaned)) {
      features.push(cleaned.replace(/^feat(\(.*?\))?:\s*/i, ''));
    } else if (/^fix(\(.*?\))?:\s*/i.test(cleaned)) {
      fixes.push(cleaned.replace(/^fix(\(.*?\))?:\s*/i, ''));
    } else if (currentSection === 'features') {
      features.push(cleaned);
    } else if (currentSection === 'fixes') {
      fixes.push(cleaned);
    } else {
      general.push(cleaned);
    }
  }

  return { features, fixes, general };
}

/**
 * Returns the release entries from the bundled local changelog.
 */
export function getLocalChangelog(): ReleaseEntry[] {
  return changelogData as unknown as ReleaseEntry[];
}

/**
 * Gets release notes for a specific version.
 * If found in local changelog.json, returns it directly in the chosen language.
 * Otherwise parses fallback markdown/text.
 */
export function getReleaseNotes(
  version?: string | null,
  fallbackBody?: string | null,
  language = 'en',
): ParsedReleaseNotes {
  if (version) {
    const cleanVersion = version.replace(/^v/, '');
    const localEntry = (changelogData as unknown as ReleaseEntry[]).find(
      (entry) => entry.version.replace(/^v/, '') === cleanVersion,
    );
    if (localEntry) {
      return {
        title: resolveTitleForLanguage(localEntry.releaseTitle, language),
        date: localEntry.date,
        features: resolveListForLanguage(localEntry.features, language),
        fixes: resolveListForLanguage(localEntry.fixes, language),
        general: resolveListForLanguage(localEntry.general, language),
      };
    }
  }

  return parseReleaseNotes(fallbackBody);
}
