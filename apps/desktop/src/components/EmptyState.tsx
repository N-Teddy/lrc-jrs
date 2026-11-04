import type React from 'react';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface EmptyStateProps {
  imageSrc?: string;
  imageAlt?: string;
  icon?: React.ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  imageSize?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  imageSrc,
  imageAlt = 'Empty state illustration',
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = '',
  imageSize = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-24 sm:w-28 sm:h-28',
    md: 'w-36 h-36 sm:w-44 sm:h-44',
    lg: 'w-48 h-48 sm:w-56 sm:h-56',
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[340px] animate-in fade-in duration-200 ${className}`}
    >
      {imageSrc ? (
        <div
          className={`relative mb-4 flex items-center justify-center overflow-hidden rounded-2xl bg-[#faf2ee]/70 p-2 ${sizeClasses[imageSize]}`}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="w-full h-full object-contain rounded-xl select-none pointer-events-none drop-shadow-xs"
            loading="lazy"
          />
        </div>
      ) : icon ? (
        <div className="w-14 h-14 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-4 shadow-2xs">
          {icon}
        </div>
      ) : null}

      <h3 className="text-base sm:text-lg font-bold text-[#1e1b19] tracking-tight mb-1 max-w-md text-balance">
        {title}
      </h3>

      {description && (
        <p className="text-xs sm:text-sm text-[#8a726a] max-w-sm sm:max-w-md leading-relaxed text-pretty mb-5">
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          {primaryAction && (
            <button
              type="button"
              onClick={primaryAction.onClick}
              className="px-4 py-2 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {primaryAction.icon}
              <span>{primaryAction.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className="px-4 py-2 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] hover:text-[#1e1b19] text-xs font-bold transition-all border border-[#e8e1dd] shadow-2xs flex items-center gap-2 cursor-pointer"
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
