import { useAuth, useTownContext } from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import { useMemo, useState } from 'react';
import { CAMEROON_REGIONS } from '../config/cameroon-map.config';
import {
  buildIsoToTownMap,
  buildIsoToTownsMap,
  mapTownCodeToIso,
  TOWN_TO_ISO_MAP,
} from '../utils/town-iso.utils';

interface UseTownSelectorOptions {
  user: IAuthUser;
  onTownSelected: (town: ITown) => void;
}

export function useTownSelector({
  user,
  onTownSelected,
}: UseTownSelectorOptions) {
  const { signOut } = useAuth();
  const { availableTowns, activeTownId, setActiveTownId } = useTownContext();

  // Accessible towns for this user
  const accessibleTowns = useMemo(() => {
    if (user.role === 'AP' || user.role === 'PC') {
      return availableTowns;
    }
    const allowed = new Set(
      user.account?.allowedReadTownIds?.map(String) || [],
    );
    if (user.homeTownId) {
      allowed.add(String(user.homeTownId));
    }
    const filtered = availableTowns.filter((t) => allowed.has(String(t.id)));
    return filtered.length > 0 ? filtered : availableTowns;
  }, [user, availableTowns]);

  // Initial selected town: Prioritize user's assigned home town on login
  const initialTown = useMemo(() => {
    if (user.homeTownId) {
      const home = accessibleTowns.find(
        (t) =>
          t.id === user.homeTownId ||
          (user.homeTownId &&
            t.code?.toUpperCase() === user.homeTownId.toUpperCase()),
      );
      if (home) return home;
    }
    if (activeTownId) {
      const found = accessibleTowns.find(
        (t) =>
          t.id === activeTownId ||
          (t.code && t.code.toUpperCase() === activeTownId.toUpperCase()),
      );
      if (found) return found;
    }
    return accessibleTowns[0] || null;
  }, [user.homeTownId, activeTownId, accessibleTowns]);

  const [selectedTown, setSelectedTown] = useState<ITown | null>(initialTown);
  const [isEntering, setIsEntering] = useState(false);

  const isoToTown = useMemo(
    () => buildIsoToTownMap(accessibleTowns),
    [accessibleTowns],
  );

  const isoToTowns = useMemo(
    () => buildIsoToTownsMap(accessibleTowns),
    [accessibleTowns],
  );

  const selectedIso = selectedTown ? mapTownCodeToIso(selectedTown.code) : null;

  const selectedRegionConfig = selectedIso
    ? CAMEROON_REGIONS[selectedIso]
    : null;

  const handleSelectTown = (town: ITown) => {
    setSelectedTown(town);
  };

  const handleConfirmAndEnter = async (townToEnter?: ITown) => {
    const town = townToEnter || selectedTown;
    if (!town) return;
    setIsEntering(true);
    try {
      await setActiveTownId(town.id);
      onTownSelected(town);
    } finally {
      setIsEntering(false);
    }
  };

  return {
    user,
    signOut,
    availableTowns: accessibleTowns,
    selectedTown,
    isEntering,
    isoToTown,
    isoToTowns,
    selectedIso,
    selectedRegionConfig,
    townToIsoMap: TOWN_TO_ISO_MAP,
    handleSelectTown,
    handleConfirmAndEnter,
  };
}
