import { useAuth, useTownContext } from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import type React from 'react';
import { useMemo, useState } from 'react';
import { CAMEROON_REGIONS } from '../config/cameroon-map.config';
import {
  buildIsoToTownMap,
  buildIsoToTownsMap,
  mapTownCodeToIso,
  TOWN_TO_ISO_MAP,
} from '../utils/town-iso.utils';

interface RegionHoverInfo {
  title: string;
  subtitle?: string;
  hasHub?: boolean;
  x: number;
  y: number;
}

interface UseRegionSelectorOptions {
  user: IAuthUser;
  onTownSelected: (town: ITown) => void;
}

export function useRegionSelector({
  user,
  onTownSelected,
}: UseRegionSelectorOptions) {
  const { signOut } = useAuth();
  const { availableTowns, activeTownId, setActiveTownId } = useTownContext();

  // Find initial selected town (activeTownId -> homeTown -> first available)
  const initialTown = useMemo(() => {
    if (activeTownId) {
      const found = availableTowns.find((t) => t.id === activeTownId);
      if (found) return found;
    }
    if (user.homeTownId) {
      const home = availableTowns.find((t) => t.id === user.homeTownId);
      if (home) return home;
    }
    return availableTowns[0] || null;
  }, [activeTownId, availableTowns, user.homeTownId]);

  const [selectedTown, setSelectedTown] = useState<ITown | null>(initialTown);
  const [hoveredIso, setHoveredIso] = useState<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<RegionHoverInfo | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  const isoToTown = useMemo(
    () => buildIsoToTownMap(availableTowns),
    [availableTowns],
  );

  const isoToTowns = useMemo(
    () => buildIsoToTownsMap(availableTowns),
    [availableTowns],
  );

  const selectedIso = selectedTown ? mapTownCodeToIso(selectedTown.code) : null;

  const selectedRegionConfig = selectedIso
    ? CAMEROON_REGIONS[selectedIso]
    : null;

  const handleSelectTown = (town: ITown) => {
    setSelectedTown(town);
  };

  const handleConfirmAndEnter = async () => {
    if (!selectedTown) return;
    setIsEntering(true);
    try {
      await setActiveTownId(selectedTown.id);
      onTownSelected(selectedTown);
    } finally {
      setIsEntering(false);
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (hoveredInfo) {
      setHoveredInfo((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null,
      );
    }
  };

  const clearHover = () => {
    setHoveredIso(null);
    setHoveredInfo(null);
  };

  return {
    user,
    signOut,
    availableTowns,
    selectedTown,
    hoveredIso,
    setHoveredIso,
    hoveredInfo,
    setHoveredInfo,
    clearHover,
    isEntering,
    isoToTown,
    isoToTowns,
    selectedIso,
    selectedRegionConfig,
    townToIsoMap: TOWN_TO_ISO_MAP,
    handleSelectTown,
    handleConfirmAndEnter,
    handleContainerMouseMove,
  };
}
