import { useTranslation } from '@jrs/client-core';
import { Warning, X, XCircle } from '@phosphor-icons/react';
import type React from 'react';

interface CancelActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  activityTitle?: string;
  isLoading?: boolean;
}

export const CancelActivityModal: React.FC<CancelActivityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activityTitle,
  isLoading = false,
}) => {
  const { t } = useTranslation(['activities', 'common']);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#23201e]/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md my-auto bg-white rounded-xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 flex items-start justify-between border-b border-[#f4ece9] bg-[#faf8f6]/50 rounded-t-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-xs">
              <Warning size={22} weight="fill" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-[#1e1b19]">
                {t('activities:detail.cancelModalTitle', 'Cancel Activity')}
              </h3>
              <p className="text-xs text-[#8a726a]">
                {t(
                  'activities:detail.cancelModalSubtitle',
                  'Confirm activity cancellation',
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-3">
          <p className="text-xs text-[#57423b] leading-relaxed">
            {t(
              'activities:detail.confirmCancelText',
              'Are you sure you want to cancel this activity? You can undo this cancellation and restore the activity at any time.',
            )}
          </p>
          {activityTitle && (
            <div className="p-3 bg-[#faf2ee] rounded-lg border border-[#e8e1dd] text-xs font-bold text-[#1e1b19] truncate">
              {activityTitle}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex items-center justify-end gap-2.5 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('common:cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <XCircle size={15} weight="bold" />
            )}
            <span>
              {t('activities:detail.confirmCancelAction', 'Cancel Activity')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
