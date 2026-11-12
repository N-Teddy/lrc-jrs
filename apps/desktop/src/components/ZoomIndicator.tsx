import {
  MagnifyingGlass,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from '@phosphor-icons/react';

interface ZoomIndicatorProps {
  zoom: number;
  visible: boolean;
}

/**
 * Floating badge that visually indicates current zoom level (e.g. 90%, 80%, 100%)
 * when the user zooms in or out via Ctrl/Cmd shortcuts.
 */
export function ZoomIndicator({ zoom, visible }: ZoomIndicatorProps) {
  if (!visible) return null;

  const percentage = Math.round(zoom * 100);
  const isDefault = percentage === 100;

  const Icon =
    percentage > 100
      ? MagnifyingGlassPlus
      : percentage < 100
        ? MagnifyingGlassMinus
        : MagnifyingGlass;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-[9999] flex items-center gap-2 rounded-full border border-white/10 bg-[#1e1b19]/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xl backdrop-blur-md transition-all duration-200"
    >
      <Icon size={16} weight="bold" className="text-[#ffdad4]" />
      <span>{percentage}%</span>
      {isDefault && (
        <span className="text-[10px] text-white/70">(Default)</span>
      )}
    </div>
  );
}
