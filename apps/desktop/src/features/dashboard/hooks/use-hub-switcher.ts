import { useTownContext } from '@jrs/client-core';
import { useCallback, useMemo, useState } from 'react';
import { CAMEROON_REGIONS } from '../../towns/config/cameroon-map.config';
import { TOWN_TO_ISO_MAP } from '../../towns/utils/town-iso.utils';

export function useHubSwitcher() {
  const { availableTowns, activeTownId, setActiveTownId } = useTownContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Map town code to Region display name
  const getRegionName = useCallback(
    (code: string, lang: 'fr' | 'en' = 'en') => {
      const upper = code.toUpperCase();
      const iso = TOWN_TO_ISO_MAP[upper];
      if (iso && CAMEROON_REGIONS[iso]) {
        return lang === 'fr'
          ? CAMEROON_REGIONS[iso].displayNameFr
          : CAMEROON_REGIONS[iso].displayNameEn;
      }
      const entry = Object.values(CAMEROON_REGIONS).find(
        (r) => r.townCode === upper || r.townCodes?.includes(upper),
      );
      if (!entry)
        return lang === 'fr' ? 'Région du Cameroun' : 'Cameroon Region';
      return lang === 'fr' ? entry.displayNameFr : entry.displayNameEn;
    },
    [],
  );

  const filteredTowns = useMemo(() => {
    if (!searchQuery.trim()) return availableTowns;
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    const q = normalize(searchQuery);
    return availableTowns.filter(
      (t) =>
        normalize(t.name).includes(q) ||
        normalize(t.code).includes(q) ||
        normalize(getRegionName(t.code, 'fr')).includes(q) ||
        normalize(getRegionName(t.code, 'en')).includes(q),
    );
  }, [availableTowns, searchQuery, getRegionName]);

  const selectTown = useCallback(
    async (townId: string) => {
      await setActiveTownId(townId);
    },
    [setActiveTownId],
  );

  return {
    availableTowns,
    activeTownId,
    searchQuery,
    setSearchQuery,
    filteredTowns,
    getRegionName,
    selectTown,
  };
}
