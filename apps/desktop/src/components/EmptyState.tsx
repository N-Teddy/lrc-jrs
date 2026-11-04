import type React from 'react';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface EmptyStateProps {
  badge?: string;
  badgeVariant?: 'sage' | 'terracotta' | 'neutral';
  imageSrc?: string;
  imageAlt?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  imageSize?: 'sm' | 'md' | 'lg';
  size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  badge,
  badgeVariant = 'sage',
  imageSrc,
  imageAlt = 'Empty state illustration',
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
  imageSize,
  size = 'md',
}) => {
  const resolvedSize = imageSize || size;

  const sizeClasses = {
    sm: 'w-32 h-24 sm:w-36 sm:h-28',
    md: 'w-48 h-36 sm:w-56 sm:h-44',
    lg: 'w-60 h-44 sm:w-72 sm:h-52',
  };

  const containerPadding =
    resolvedSize === 'sm'
      ? 'p-6 sm:p-8 min-h-[220px]'
      : 'p-8 sm:p-14 min-h-[340px]';

  const badgeStyles = {
    sage: 'bg-[#c2e9ca]/40 text-[#2c4e37] border-[#a9d0b2]',
    terracotta: 'bg-[#ffdacf]/50 text-[#983912] border-[#f4c6b8]',
    neutral: 'bg-[#faf2ee] text-[#57423b] border-[#e8e1dd]',
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col items-center justify-center text-center animate-in fade-in duration-200 ${containerPadding} ${className}`}
    >
      {badge && (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mb-4 uppercase tracking-wider ${badgeStyles[badgeVariant]}`}
        >
          {badge}
        </span>
      )}

      {imageSrc ? (
        <div
          className={`relative mb-5 flex items-center justify-center select-none pointer-events-none ${sizeClasses[resolvedSize]}`}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-contain drop-shadow-sm"
            loading="lazy"
          />
        </div>
      ) : icon ? (
        <div className="w-14 h-14 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] mb-4 shadow-2xs">
          {icon}
        </div>
      ) : null}

      <h3 className="text-base sm:text-lg font-bold text-[#1e1b19] tracking-tight mb-1.5 max-w-lg text-balance">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-[#7a625a] max-w-sm sm:max-w-md leading-relaxed text-pretty mb-6">
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#a44520] active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] active:scale-[0.98] text-[#57423b] hover:text-[#1e1b19] text-xs sm:text-sm font-bold transition-all border border-[#e8e1dd] shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              {secondaryAction.icon}
              <span>{secondaryAction.label}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
