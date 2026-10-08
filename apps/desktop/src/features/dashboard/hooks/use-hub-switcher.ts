import { useTownContext } from '@jrs/client-core';
import { useCallback, useMemo, useState } from 'react';
import { CAMEROON_REGIONS } from '../../towns/config/cameroon-map.config';

export function useHubSwitcher() {
  const { availableTowns, activeTownId, setActiveTownId } = useTownContext();
  const [searchQuery, setSearchQuery] = useState('');

  // Map town code to Region display name
  const getRegionName = useCallback((code: string) => {
    const upper = code.toUpperCase();
    const entry = Object.values(CAMEROON_REGIONS).find(
      (r) => r.townCode === upper,
    );
    return entry?.displayNameEn || 'Cameroon Region';
  }, []);

  const filteredTowns = useMemo(() => {
    if (!searchQuery.trim()) return availableTowns;
    const q = searchQuery.toLowerCase();
    return availableTowns.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        getRegionName(t.code).toLowerCase().includes(q),
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
