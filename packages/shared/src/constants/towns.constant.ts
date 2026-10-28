import type { ITown } from '../types/town.interface.js';

export const DEFAULT_TOWNS = [
  { name: 'Douala', code: 'DLA' },
  { name: 'Edéa', code: 'EDA' },
  { name: 'Yaoundé', code: 'YDE' },
  { name: 'Bafoussam', code: 'BAF' },
] as const;

export const MAX_ACTIVE_PCS_PER_TOWN = 2;

/**
 * Mapping between community town codes and Cameroon administrative region ISO codes.
 */
export const TOWN_TO_ISO_MAP: Record<string, string> = {
  DLA: 'CM-LT',
  EDA: 'CM-LT',
  EDE: 'CM-LT',
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
    if (iso && !map[iso]) {
      map[iso] = town;
    }
  }
  return map;
}

/**
 * Constructs an ISO-to-Towns array lookup dictionary from available towns.
 */
export function buildIsoToTownsMap(towns: ITown[]): Record<string, ITown[]> {
  const map: Record<string, ITown[]> = {};
  for (const town of towns) {
    const iso = mapTownCodeToIso(town.code);
    if (iso) {
      if (!map[iso]) {
        map[iso] = [];
      }
      map[iso].push(town);
    }
  }
  return map;
}
