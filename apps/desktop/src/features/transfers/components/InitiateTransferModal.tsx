import { useTransferTownMutation, useTranslation } from '@jrs/client-core';
import type { ITown, IUser } from '@jrs/shared';
import { ArrowsLeftRight, WarningCircle, X } from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CustomSelect,
  type SelectOption,
  UserAvatar,
} from '../../../components';

interface InitiateTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  eligibleMembers: IUser[];
  towns: ITown[];
  activeTown?: ITown | null;
}

export const InitiateTransferModal: React.FC<InitiateTransferModalProps> = ({
  isOpen,
  onClose,
  eligibleMembers,
  towns,
  activeTown,
}) => {
  const { t } = useTranslation(['transfers', 'common']);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [destinationTownId, setDestinationTownId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const transferMutation = useTransferTownMutation();

  const townsMap = useMemo(() => {
    return new Map(towns.map((tw) => [tw.id, tw]));
  }, [towns]);

  const memberSelectOptions: SelectOption[] = useMemo(() => {
    return eligibleMembers.map((m) => {
      const townName = townsMap.get(m.homeTownId)?.name || 'Hub';
      return {
        value: m.id,
        label: `${m.fullName} (${m.phoneNumber}) - ${townName}`,
      };
    });
  }, [eligibleMembers, townsMap]);

  const selectedMember = useMemo(() => {
    return (
      eligibleMembers.find((m) => m.id === selectedMemberId) ||
      eligibleMembers[0] ||
      null
    );
  }, [eligibleMembers, selectedMemberId]);

  const currentMemberTownId = selectedMember?.homeTownId || activeTown?.id;
  const currentMemberTown = currentMemberTownId
    ? townsMap.get(currentMemberTownId)
    : activeTown;

  const availableDestTowns = useMemo(() => {
    if (!currentMemberTownId) return towns;
    return towns.filter((tw) => tw.id !== currentMemberTownId);
  }, [towns, currentMemberTownId]);

  const destTownOptions: SelectOption[] = useMemo(() => {
    return availableDestTowns.map((tw) => ({
      value: tw.id,
      label: `${tw.name} (${tw.code})`,
    }));
  }, [availableDestTowns]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setTransferReason('');
      if (eligibleMembers.length > 0) {
        setSelectedMemberId(eligibleMembers[0].id);
      } else {
        setSelectedMemberId('');
      }
    }
  }, [isOpen, eligibleMembers]);

  useEffect(() => {
    if (availableDestTowns.length > 0) {
      setDestinationTownId(availableDestTowns[0].id);
    } else {
      setDestinationTownId('');
    }
  }, [availableDestTowns]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !destinationTownId) {
      setErrorMessage(
        t(
          'transfers:modal.errorSelect',
          'Please select a member and a destination hub.',
        ),
      );
      return;
    }

    try {
      setErrorMessage(null);
      await transferMutation.mutateAsync({
        userId: selectedMemberId,
        dto: {
          toTownId: destinationTownId,
          reason: transferReason.trim() || undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          t('transfers:modal.errorGeneric', 'Failed to complete transfer.'),
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl bg-white border border-[#e8e1dd] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#f4ece9]">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowsLeftRight size={22} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-[#1e1b19]">
                {t('transfers:modal.title', 'Initiate Member Transfer')}
              </h2>
              <p className="text-xs text-[#8a726a]">
                {t('transfers:modal.subtitle', {
                  from: currentMemberTown?.name || 'Hub',
                  defaultValue: `Relocate a member from ${currentMemberTown?.name || 'Hub'} to another town hub.`,
                })}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-lg bg-[#ffdad6]/60 border border-[#ffb4ab] text-xs font-semibold text-[#ba1a1a] flex items-center gap-2.5">
            <WarningCircle size={18} weight="fill" className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleExecuteTransfer} className="flex flex-col gap-5">
          {/* Member Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#1e1b19]">
              {t('transfers:modal.selectMember', 'Select Community Member')}{' '}
              <span className="text-[#ba1a1a]">*</span>
            </span>
            <CustomSelect
              options={memberSelectOptions}
              value={selectedMemberId}
              onChange={(val) => setSelectedMemberId(val)}
              placeholder={t(
                'transfers:modal.selectMemberPlaceholder',
                'Select member to transfer...',
              )}
            />
          </div>

          {/* Member Details Preview Card */}
          {selectedMember && (
            <div className="p-3.5 rounded-lg bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <UserAvatar
                  name={selectedMember.fullName}
                  avatarUrl={selectedMember.avatarUrl}
                  size="sm"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#1e1b19] truncate">
                    {selectedMember.fullName}
                  </span>
                  <span className="text-[11px] text-[#8a726a]">
                    {selectedMember.phoneNumber}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-[#8a726a] block">
                  {t('transfers:modal.currentSeat', 'Current Seat')}
                </span>
                <span className="text-xs font-bold text-[#1e1b19]">
                  {currentMemberTown?.name || 'Hub'} (
                  {currentMemberTown?.code || '—'})
                </span>
              </div>
            </div>
          )}

          {/* Destination Hub Select */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#1e1b19]">
              {t('transfers:modal.destinationHub', 'Destination Town Hub')}{' '}
              <span className="text-[#ba1a1a]">*</span>
            </span>
            <CustomSelect
              options={destTownOptions}
              value={destinationTownId}
              onChange={(val) => setDestinationTownId(val)}
              placeholder={t(
                'transfers:modal.destinationHubPlaceholder',
                'Select destination hub...',
              )}
            />
          </div>

          {/* Relocation Reason / Transfer Notes */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="initiate-transfer-reason"
              className="text-xs font-bold text-[#1e1b19]"
            >
              {t(
                'transfers:modal.reasonLabel',
                'Relocation Reason / Transfer Notes',
              )}{' '}
              <span className="text-[#8a726a] font-normal">
                {t('transfers:modal.optional', '(Optional)')}
              </span>
            </label>
            <textarea
              id="initiate-transfer-reason"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
              placeholder={t(
                'transfers:modal.reasonPlaceholder',
                'e.g. Relocated to Douala for university studies or career transition...',
              )}
              rows={3}
              className="w-full p-3 rounded-md bg-[#faf2ee]/40 border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] focus:outline-none focus:border-[#b85028] focus:bg-white transition-all shadow-2xs resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f4ece9]">
            <button
              type="button"
              onClick={onClose}
              disabled={transferMutation.isPending}
              className="px-4 py-2.5 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-all cursor-pointer disabled:opacity-50"
            >
              {t('common:cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={
                !selectedMemberId ||
                !destinationTownId ||
                transferMutation.isPending
              }
              className="px-5 py-2.5 rounded-md bg-[#b85028] hover:bg-[#9c421f] text-xs font-bold text-white transition-all flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {transferMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {t('transfers:modal.transferring', 'Transferring...')}
                  </span>
                </>
              ) : (
                <>
                  <ArrowsLeftRight size={15} weight="bold" />
                  <span>
                    {t('transfers:modal.confirm', 'Confirm Transfer')}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
