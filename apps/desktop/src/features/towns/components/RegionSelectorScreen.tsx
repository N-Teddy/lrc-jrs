import { useTranslation } from '@jrs/client-core';
import type { IAuthUser, ITown } from '@jrs/shared';
import { ArrowRight, MapPin, SignOut } from '@phosphor-icons/react';
import type React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import cameroonGeo from '../../../assets/geo/cameroon-regions.json';
import { LanguageToggle } from '../../../components/LanguageToggle';
import { CAMEROON_REGIONS } from '../config/cameroon-map.config';
import { useRegionSelector } from '../hooks/use-region-selector';

interface RegionSelectorScreenProps {
  user: IAuthUser;
  onTownSelected: (town: ITown) => void;
}

export const RegionSelectorScreen: React.FC<RegionSelectorScreenProps> = ({
  user,
  onTownSelected,
}) => {
  const { t, i18n } = useTranslation();
  const isFrench = i18n.language?.startsWith('fr');
  const {
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
    selectedIso,
    selectedRegionConfig,
    townToIsoMap,
    handleSelectTown,
    handleConfirmAndEnter,
    handleContainerMouseMove,
  } = useRegionSelector({ user, onTownSelected });

  return (
    <div
      className="relative flex h-screen w-screen overflow-hidden bg-[#faf8f5] select-none"
      onMouseMove={handleContainerMouseMove}
    >
      {/* Background Subtle Grid Texture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e8e1dd_1px,transparent_1px)] [background-size:28px_28px] opacity-40" />

      {/* Floating Hover Tooltip */}
      {hoveredInfo && (
        <div
          className="pointer-events-none fixed z-50 transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-1.5 rounded-lg bg-[#1e1b19]/95 text-white text-xs font-semibold shadow-xl border border-white/10 flex items-center gap-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
          style={{ left: hoveredInfo.x, top: hoveredInfo.y - 12 }}
        >
          <MapPin
            size={14}
            weight="fill"
            className={hoveredInfo.hasHub ? 'text-[#ffb59c]' : 'text-[#ded5d0]'}
          />
          <div className="flex flex-col leading-tight">
            <span>{hoveredInfo.title}</span>
            {hoveredInfo.subtitle && (
              <span className="text-[10px] text-[#ded5d0] font-normal">
                {hoveredInfo.subtitle}
              </span>
            )}
          </div>
          {hoveredInfo.hasHub && (
            <span className="text-[9px] bg-[#b85028] text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1">
              {t('towns:activeHub')}
            </span>
          )}
        </div>
      )}

      {/* Top Left Floating Title Overlay */}
      <div className="absolute top-6 left-8 z-20">
        <h1 className="text-2xl font-black tracking-tight text-[#1e1b19] sm:text-3xl">
          {t('towns:selectHubTitle')}
        </h1>
        <p className="mt-1 max-w-md text-xs sm:text-sm text-[#6e5850]">
          {t('towns:selectHubSubtitle')}
        </p>
      </div>

      {/* Top Right Floating Profile & Sign Out Controls */}
      <div className="absolute top-6 right-8 z-20 flex items-center gap-3">
        <LanguageToggle size="md" />

        <div className="h-10 flex items-center gap-2.5 rounded-lg border border-[#e8e1dd] bg-white/90 px-3.5 text-xs shadow-xs backdrop-blur-md">
          <span className="rounded bg-[#edf3ee] px-2 py-0.5 text-[11px] font-bold text-[#486b52]">
            {user.role}
          </span>
          <span className="font-semibold text-[#1e1b19]">{user.fullName}</span>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="h-10 flex cursor-pointer items-center gap-2 rounded-lg border border-[#ffb4a8] bg-[#fff2ee] px-3.5 text-xs font-bold text-[#ba1a1a] shadow-xs backdrop-blur-md transition hover:bg-[#ffdad6]"
          title={t('common:signOut')}
        >
          <SignOut size={16} weight="bold" />
          <span>{t('common:signOut')}</span>
        </button>
      </div>

      {/* Main Expansive Center Map Canvas */}
      <div className="relative flex h-full w-full flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="relative flex h-full w-full max-h-[94vh] max-w-6xl items-center justify-center">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              center: [12.5, 7.35],
              scale: 4500,
            }}
            width={1000}
            height={900}
            className="h-full w-full object-contain drop-shadow-sm"
          >
            <Geographies geography={cameroonGeo as any}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const iso = geo.properties?.shapeISO || '';
                  const hasTown = Boolean(isoToTown[iso]);
                  const isSelected = selectedIso === iso;
                  const isHovered = hoveredIso === iso;
                  const regionConfig = CAMEROON_REGIONS[iso];
                  const regionName = isFrench
                    ? regionConfig?.displayNameFr ||
                      geo.properties?.shapeName ||
                      'Région'
                    : regionConfig?.displayNameEn ||
                      geo.properties?.shapeName ||
                      'Region';

                  let fillColor = '#f4ece9';
                  let strokeColor = '#ded5d0';
                  let strokeWidth = 0.9;

                  if (isSelected) {
                    fillColor = isHovered ? '#983912' : '#b85028';
                    strokeColor = '#732402';
                    strokeWidth = 2.2;
                  } else if (hasTown) {
                    fillColor = isHovered ? '#ffdbcf' : '#edf3ee';
                    strokeColor = isHovered ? '#b85028' : '#486b52';
                    strokeWidth = isHovered ? 2 : 1.5;
                  } else if (isHovered) {
                    fillColor = '#ebe1dc';
                    strokeColor = '#c7b6ae';
                    strokeWidth = 1.1;
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={(e: React.MouseEvent) => {
                        setHoveredIso(iso);
                        setHoveredInfo({
                          title: regionName,
                          subtitle: hasTown
                            ? `${isoToTown[iso].name} ${t('towns:hub')} (${isoToTown[iso].code})`
                            : t('towns:noActiveHub'),
                          hasHub: hasTown,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      onMouseMove={(e: React.MouseEvent) => {
                        setHoveredInfo((prev) =>
                          prev
                            ? {
                                ...prev,
                                x: e.clientX,
                                y: e.clientY,
                              }
                            : null,
                        );
                      }}
                      onMouseLeave={clearHover}
                      onClick={() => {
                        if (hasTown) {
                          handleSelectTown(isoToTown[iso]);
                        }
                      }}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      className={`transition-all duration-200 outline-none ${
                        hasTown ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    />
                  );
                })
              }
            </Geographies>

            {/* Town Pins / Interactive Markers */}
            {availableTowns.map((town) => {
              const iso = townToIsoMap[town.code.toUpperCase()];
              const config = iso ? CAMEROON_REGIONS[iso] : null;
              if (!config) return null;

              const isSelected = selectedTown?.id === town.id;

              return (
                <Marker
                  key={town.id}
                  coordinates={config.coordinates}
                  onClick={() => handleSelectTown(town)}
                >
                  <g
                    className="group cursor-pointer"
                    onMouseEnter={(e: React.MouseEvent) => {
                      setHoveredInfo({
                        title: `${town.name} ${t('towns:hub')} (${town.code})`,
                        subtitle: isFrench
                          ? config.displayNameFr
                          : config.displayNameEn,
                        hasHub: true,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }}
                    onMouseMove={(e: React.MouseEvent) => {
                      setHoveredInfo((prev) =>
                        prev
                          ? {
                              ...prev,
                              x: e.clientX,
                              y: e.clientY,
                            }
                          : null,
                      );
                    }}
                    onMouseLeave={clearHover}
                  >
                    {/* Outer pulsing ring */}
                    <circle
                      r={isSelected ? 14 : 9}
                      className={
                        isSelected
                          ? 'fill-[#b85028]/35 animate-ping'
                          : 'fill-[#486b52]/30'
                      }
                    />

                    {/* Center solid pin */}
                    <circle
                      r={isSelected ? 7 : 5.5}
                      fill={isSelected ? '#b85028' : '#486b52'}
                      stroke="#ffffff"
                      strokeWidth={2.2}
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Text Label */}
                    <g transform={`translate(0, ${isSelected ? -16 : -13})`}>
                      <text
                        textAnchor="middle"
                        style={{
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          fontSize: isSelected ? '13px' : '11px',
                          fontWeight: isSelected ? 800 : 700,
                          fill: isSelected ? '#b85028' : '#1e1b19',
                          filter:
                            'drop-shadow(0 1px 3px rgba(255,255,255,0.95))',
                        }}
                      >
                        {town.name}
                      </text>
                    </g>
                  </g>
                </Marker>
              );
            })}
          </ComposableMap>
        </div>
      </div>

      {/* Floating Selected Hub Action Card (Bottom-Right) */}
      {selectedTown ? (
        <div className="absolute right-8 bottom-8 z-20 w-80 rounded-xl border border-[#e8e1dd] bg-white/95 p-5 shadow-xl backdrop-blur-md transition-all duration-300 sm:w-92">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8a726a]">
                {(isFrench
                  ? selectedRegionConfig?.displayNameFr
                  : selectedRegionConfig?.displayNameEn) ||
                  t('towns:activeHub')}
              </span>
              <h2 className="mt-0.5 text-xl font-bold text-[#1e1b19]">
                {selectedTown.name} {t('towns:hub')}
              </h2>
            </div>
            <span className="rounded-md border border-[#e8e1dd] bg-[#faf2ee] px-2.5 py-1 font-mono text-xs font-bold text-[#b85028]">
              {selectedTown.code}
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-2 text-xs text-[#486b52]">
            <span className="inline-block h-2 w-2 rounded-full bg-[#486b52] animate-pulse" />
            <span className="font-semibold">{t('towns:activeWorkspace')}</span>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleConfirmAndEnter}
              disabled={isEntering}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#b85028] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#983912] active:scale-[0.99] disabled:opacity-50"
            >
              <span>
                {t('towns:enterWorkspace', { town: selectedTown.name })}
              </span>
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      ) : (
        <div className="absolute right-8 bottom-8 z-20 w-80 rounded-xl border border-[#e8e1dd] bg-white/95 p-6 text-center text-[#8a726a] shadow-xl backdrop-blur-md sm:w-92">
          <MapPin size={28} className="mx-auto mb-2 text-[#b85028]" />
          <p className="font-semibold text-sm text-[#1e1b19]">
            {t('towns:noRegionSelected')}
          </p>
          <p className="mt-1 text-xs">{t('towns:clickHighlighted')}</p>
        </div>
      )}
    </div>
  );
};
