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
  imageSize?: 'sm' | 'md' | 'lg' | 'xl';
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  size = 'lg',
}) => {
  const resolvedSize = imageSize || size;

  // Generous, prominent illustration scale
  const sizeClasses = {
    sm: 'w-44 h-36 sm:w-52 sm:h-40',
    md: 'w-64 h-52 sm:w-80 sm:h-60',
    lg: 'w-72 h-56 sm:w-96 sm:h-72 md:w-[420px] md:h-[280px]',
    xl: 'w-80 h-64 sm:w-[460px] sm:h-[320px]',
  };

  const containerPadding =
    resolvedSize === 'sm' ? 'py-8 px-4' : 'py-12 sm:py-16 px-4';

  const badgeStyles = {
    sage: 'bg-[#c2e9ca]/50 text-[#2c4e37] border-[#a9d0b2]',
    terracotta: 'bg-[#ffdacf]/60 text-[#983912] border-[#f4c6b8]',
    neutral: 'bg-white/80 text-[#57423b] border-[#e8e1dd]',
  };

  return (
    <div
      className={`w-full flex flex-col items-center justify-center text-center animate-in fade-in duration-200 select-none ${containerPadding} ${className}`}
    >
      {badge && (
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border mb-4 uppercase tracking-wider shadow-2xs ${badgeStyles[badgeVariant]}`}
        >
          {badge}
        </span>
      )}

      {imageSrc ? (
        <div
          className={`relative mb-6 flex items-center justify-center pointer-events-none ${sizeClasses[resolvedSize]}`}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-contain drop-shadow-sm select-none"
            loading="lazy"
          />
        </div>
      ) : icon ? (
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#e8e1dd] flex items-center justify-center text-[#b85028] mb-5 shadow-xs">
          {icon}
        </div>
      ) : null}

      <h3 className="text-base sm:text-xl font-bold text-[#1e1b19] tracking-tight mb-1.5 max-w-lg text-balance">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-[#7a625a] max-w-md leading-relaxed text-pretty mb-6">
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#a44520] active:scale-[0.98] text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#faf2ee] active:scale-[0.98] text-[#57423b] hover:text-[#1e1b19] text-xs sm:text-sm font-bold transition-all border border-[#e8e1dd] shadow-2xs flex items-center gap-2 cursor-pointer"
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
