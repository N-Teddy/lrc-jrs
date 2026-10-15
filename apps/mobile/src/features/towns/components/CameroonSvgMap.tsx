import type { ITown } from '@jrs/shared';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CAMEROON_TOWNS_CONFIG } from '../config/cameroon-map.config';
import { CAMEROON_REGION_PATHS } from '../data/cameroon-svg-paths';
import {
  getTownSvgCoordinates,
  mapTownCodeToIso,
} from '../utils/town-iso.utils';

interface CameroonSvgMapProps {
  availableTowns: ITown[];
  selectedTown: ITown | null;
  onSelectTown: (town: ITown) => void;
  onSelectRegion?: (iso: string) => void;
}

export const CameroonSvgMap: React.FC<CameroonSvgMapProps> = ({
  availableTowns,
  selectedTown,
  onSelectTown,
  onSelectRegion,
}) => {
  const selectedIso = selectedTown ? mapTownCodeToIso(selectedTown.code) : null;

  // Set of ISO codes that contain at least one available town
  const activeRegionIsos = new Set<string>();
  for (const town of availableTowns) {
    const iso = mapTownCodeToIso(town.code);
    if (iso) activeRegionIsos.add(iso);
  }

  // Handle region tap: if that region has town(s), select the town
  const handleRegionPress = (iso: string) => {
    onSelectRegion?.(iso);
    const townsInRegion = availableTowns.filter(
      (t) => mapTownCodeToIso(t.code) === iso,
    );
    if (townsInRegion.length === 1) {
      onSelectTown(townsInRegion[0]);
    } else if (townsInRegion.length > 1) {
      const currentIndex = townsInRegion.findIndex(
        (t) => t.id === selectedTown?.id,
      );
      const nextTown =
        currentIndex >= 0
          ? townsInRegion[(currentIndex + 1) % townsInRegion.length]
          : townsInRegion[0];
      onSelectTown(nextTown);
    }
  };

  return (
    <View style={styles.container}>
      <Svg
        viewBox="160 -15 650 930"
        preserveAspectRatio="xMidYMid meet"
        style={styles.svg}
      >
        {/* Cameroon Regions Path rendering */}
        {Object.entries(CAMEROON_REGION_PATHS).map(([iso, regionData]) => {
          const isSelected = selectedIso === iso;
          const hasHub = activeRegionIsos.has(iso);

          let fillColor = '#F4ECE9';
          let strokeColor = '#DCD3CE';
          let strokeWidth = 1.2;

          if (isSelected) {
            fillColor = '#FBECE6';
            strokeColor = '#B85028';
            strokeWidth = 2.8;
          } else if (hasHub) {
            fillColor = '#EDF3EE';
            strokeColor = '#486B52';
            strokeWidth = 1.8;
          }

          return (
            <G key={iso}>
              <Path
                d={regionData.path}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
                onPress={() => handleRegionPress(iso)}
              />

              {/* Show subtle region label for non-hub regions */}
              {!hasHub && (
                <SvgText
                  x={regionData.centroid[0]}
                  y={regionData.centroid[1]}
                  textAnchor="middle"
                  fill="#B5A49D"
                  fontSize="11"
                  fontWeight="600"
                  opacity={0.8}
                >
                  {regionData.shapeName}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Town Markers & Pins */}
        {availableTowns.map((town) => {
          const coords = getTownSvgCoordinates(town);
          const isSelected = selectedTown?.id === town.id;
          const townConfig = CAMEROON_TOWNS_CONFIG[town.code.toUpperCase()];
          const labelDx = townConfig?.labelOffset
            ? townConfig.labelOffset[0]
            : 0;
          const labelDy = townConfig?.labelOffset
            ? townConfig.labelOffset[1]
            : isSelected
              ? -18
              : -14;

          const labelX = coords[0] + labelDx;
          const labelY = coords[1] + labelDy;

          return (
            <G key={town.id}>
              {/* Outer Glowing / Pulsing Ring */}
              <Circle
                cx={coords[0]}
                cy={coords[1]}
                r={isSelected ? 16 : 10}
                fill={isSelected ? '#B85028' : '#486B52'}
                opacity={isSelected ? 0.35 : 0.22}
              />

              {/* Inner Solid Marker Circle */}
              <Circle
                cx={coords[0]}
                cy={coords[1]}
                r={isSelected ? 7.5 : 5.5}
                fill={isSelected ? '#B85028' : '#486B52'}
                stroke="#FFFFFF"
                strokeWidth={2.4}
              />

              {/* Text Label Background Pill */}
              <G transform={`translate(${labelX}, ${labelY})`}>
                <Rect
                  x={-34}
                  y={-11}
                  width={68}
                  height={18}
                  rx={5}
                  fill={isSelected ? '#B85028' : '#1E1B19'}
                  opacity={0.92}
                />
                <SvgText
                  x={0}
                  y={2}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize={isSelected ? '11' : '10'}
                  fontWeight={isSelected ? '800' : '700'}
                  letterSpacing={0.3}
                >
                  {town.name}
                </SvgText>
              </G>

              {/* Large Invisible Hit Area for Easy Touch on Mobile (56x56 radius) */}
              <Circle
                cx={coords[0]}
                cy={coords[1]}
                r={28}
                fill="transparent"
                onPress={() => onSelectTown(town)}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    width: '100%',
    height: '100%',
  },
});
