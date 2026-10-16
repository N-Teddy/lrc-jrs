import { useTownsQuery, useTransferTownMutation } from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ArrowRight,
  ArrowsLeftRight,
  Info,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CustomSelect,
  type SelectOption,
  UserAvatar,
} from '../../../components';

interface TransferTownModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: IUser;
}

export const TransferTownModal: React.FC<TransferTownModalProps> = ({
  isOpen,
  onClose,
  member,
}) => {
  const { data: towns = [], isLoading: isTownsLoading } = useTownsQuery();
  const transferMutation = useTransferTownMutation();

  const [toTownId, setToTownId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter out the member's current home town
  const currentTownId = member.homeTownId;
  const availableTowns = useMemo(() => {
    return towns.filter((t) => t.id !== currentTownId);
  }, [towns, currentTownId]);

  const townOptions: SelectOption[] = useMemo(() => {
    return availableTowns.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.code})`,
    }));
  }, [availableTowns]);

  // Set default selection when towns load or modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setReason('');
      if (availableTowns.length > 0) {
        setToTownId(availableTowns[0].id);
      } else {
        setToTownId('');
      }
    }
  }, [isOpen, availableTowns]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedTown = towns.find((t) => t.id === toTownId);
  const currentTownName = member.homeTown?.name || 'Current Assigned Hub';
  const currentTownCode = member.homeTown?.code || 'HUB';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toTownId) {
      setErrorMessage('Please select a destination town hub.');
      return;
    }

    try {
      setErrorMessage(null);
      await transferMutation.mutateAsync({
        userId: member.id,
        dto: {
          toTownId,
          reason: reason.trim() || undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to transfer member. Please check permissions and try again.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#e8e1dd] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#f4ece9]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowsLeftRight size={22} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#1e1b19]">
                Transfer Member Hub
              </h2>
              <p className="text-xs text-[#8a726a]">
                Relocate member to a new Cameroon canonical fellowship hub.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-[#ffdad6]/60 border border-[#ffb4ab] text-xs font-semibold text-[#ba1a1a] flex items-center gap-2.5">
            <WarningCircle size={18} weight="fill" className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Member Profile Badge */}
          <div className="p-4 rounded-2xl bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center gap-3.5">
            <UserAvatar
              name={member.fullName}
              avatarUrl={member.avatarUrl}
              size="md"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#1e1b19] truncate">
                {member.fullName}
              </span>
              <span className="text-[11px] text-[#8a726a]">
                {member.phoneNumber} • {member.role}
              </span>
            </div>
          </div>

          {/* Transfer Visual Direction: Current Hub -> Destination Hub */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-[#1e1b19]">
              Relocation Journey
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
              {/* Origin Card */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#fff8e1] border border-[#ffe082] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#812901] uppercase tracking-wider">
                  Origin Hub
                </span>
                <span className="text-xs font-black text-[#1e1b19] truncate">
                  {currentTownName}
                </span>
                <span className="text-[11px] font-mono text-[#8a726a]">
                  ({currentTownCode})
                </span>
              </div>

              {/* Arrow */}
              <div className="sm:col-span-1 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#b85028] shadow-2xs">
                  <ArrowRight size={14} weight="bold" />
                </div>
              </div>

              {/* Destination Card Preview */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-[#eef7f0] border border-[#c2e9ca] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#2c4e37] uppercase tracking-wider">
                  Destination Hub
                </span>
                <span className="text-xs font-black text-[#1e1b19] truncate">
                  {selectedTown?.name || 'Select Hub'}
                </span>
                <span className="text-[11px] font-mono text-[#8a726a]">
                  ({selectedTown?.code || '—'})
                </span>
              </div>
            </div>
          </div>

          {/* Destination Hub Select */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#1e1b19]">
              Destination Town Hub <span className="text-[#ba1a1a]">*</span>
            </span>
            {isTownsLoading ? (
              <div className="h-10 bg-[#faf2ee] rounded-xl animate-pulse" />
            ) : availableTowns.length === 0 ? (
              <div className="p-3 text-xs text-[#8a726a] bg-[#faf2ee] rounded-xl border border-[#e8e1dd]">
                No other town hubs available for transfer.
              </div>
            ) : (
              <CustomSelect
                options={townOptions}
                value={toTownId}
                onChange={(val) => setToTownId(val)}
                placeholder="Choose target hub..."
              />
            )}
          </div>

          {/* Transfer Reason */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="transfer-reason"
              className="text-xs font-bold text-[#1e1b19]"
            >
              Relocation Reason / Transfer Notes{' '}
              <span className="text-[#8a726a] font-normal">(Optional)</span>
            </label>
            <textarea
              id="transfer-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Relocated to Douala for university studies, professional employment, or family relocation..."
              rows={3}
              className="w-full p-3 rounded-xl bg-[#faf2ee]/40 border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] focus:outline-none focus:border-[#b85028] focus:bg-white transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Administrative Notice */}
          <div className="p-3.5 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-start gap-2.5">
            <Info
              size={16}
              weight="bold"
              className="text-[#8a726a] shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-[#57423b] leading-relaxed">
              Transferring a member permanently associates them with the new
              regional hub, adjusts administrative visibility, and preserves an
              immutable audit record in their relocation registry.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f4ece9]">
            <button
              type="button"
              onClick={onClose}
              disabled={transferMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!toTownId || transferMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#9c421f] text-xs font-bold text-white transition-all flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {transferMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Transferring Member...</span>
                </>
              ) : (
                <>
                  <ArrowsLeftRight size={15} weight="bold" />
                  <span>Confirm Hub Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
