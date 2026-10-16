import type { ITown } from '@jrs/shared';
import { mapTownCodeToIso, TOWN_TO_ISO_MAP } from '@jrs/shared';
import {
  CAMEROON_REGIONS,
  CAMEROON_TOWNS_CONFIG,
} from '../config/cameroon-map.config';

export {
  buildIsoToTownMap,
  buildIsoToTownsMap,
  mapTownCodeToIso,
  TOWN_TO_ISO_MAP,
} from '@jrs/shared';

/**
 * Converts longitude and latitude coordinates into SVG canvas (1000x900) coordinates.
 * Using GeoMercator projection centered at [12.5, 7.35] with scale 4500 and translate [500, 450].
 */
function _projectMercator(lng: number, lat: number): [number, number] {
  const lambda = (lng - 12.5) * (Math.PI / 180);
  const phi = (lat * Math.PI) / 180;
  const phi0 = (7.35 * Math.PI) / 180;
  const x = 500 + 4500 * lambda;
  const y0 = Math.log(Math.tan(Math.PI / 4 + phi0 / 2));
  const y1 = Math.log(Math.tan(Math.PI / 4 + phi / 2));
  const y = 450 - 4500 * (y1 - y0);
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

/**
 * Resolves the SVG coordinates for a town.
 */
export function getTownSvgCoordinates(town: ITown): [number, number] {
  const code = town.code.toUpperCase();
  const townConfig = CAMEROON_TOWNS_CONFIG[code];
  if (townConfig?.svgCoordinates) {
    return townConfig.svgCoordinates;
  }
  const iso = mapTownCodeToIso(code);
  if (iso && CAMEROON_REGIONS[iso]?.svgCoordinates) {
    return CAMEROON_REGIONS[iso].svgCoordinates;
  }
  return [500, 450];
}
