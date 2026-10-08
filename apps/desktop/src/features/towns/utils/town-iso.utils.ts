import type { ITown } from '@jrs/shared';

/**
 * Mapping between fellowship town codes and Cameroon administrative region ISO codes.
 */
export const TOWN_TO_ISO_MAP: Record<string, string> = {
  DLA: 'CM-LT',
  YDE: 'CM-CE',
  BAF: 'CM-OU',
};

/**
 * Resolves the ISO region code for a given town code.
 */
export function mapTownCodeToIso(townCode: string): string | null {
  return TOWN_TO_ISO_MAP[townCode.toUpperCase()] || null;
}

/**
 * Constructs an ISO-to-Town lookup dictionary from available towns.
 */
export function buildIsoToTownMap(towns: ITown[]): Record<string, ITown> {
  const map: Record<string, ITown> = {};
  for (const town of towns) {
    const iso = mapTownCodeToIso(town.code);
    if (iso) {
      map[iso] = town;
    }
  }
  return map;
}
