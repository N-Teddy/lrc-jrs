import { useTranslation } from '@jrs/client-core';
import type React from 'react';

export interface PaginationControlProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  variant?: 'white' | 'cream';
  className?: string;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  page,
  totalPages,
  onPageChange,
  variant = 'cream',
  className = '',
}) => {
  const { t } = useTranslation(['common']);

  if (totalPages <= 1) return null;

  const btnBg =
    variant === 'white'
      ? 'bg-white hover:bg-[#faf2ee]'
      : 'bg-[#faf2ee] hover:bg-[#f4ece9]';

  return (
    <div className={`flex items-center gap-1 ${className}`.trim()}>
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={`px-2.5 py-1 rounded-md ${btnBg} border border-[#e8e1dd] text-[#1e1b19] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        {t('common:prev') || 'Prev'}
      </button>
      <span className="px-3 py-1 font-bold text-[#1e1b19]">
        {page} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={`px-2.5 py-1 rounded-md ${btnBg} border border-[#e8e1dd] text-[#1e1b19] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
      >
        {t('common:next') || 'Next'}
      </button>
    </div>
  );
};
