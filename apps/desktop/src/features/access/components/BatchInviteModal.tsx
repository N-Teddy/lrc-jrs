import { useTranslation } from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ChatCircleText,
  Check,
  EnvelopeSimple,
  PaperPlaneTilt,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { UserAvatar } from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';

interface BatchInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  offlineMembers: IUser[];
  onBatchInvite: (
    memberIds: string[],
    channel: 'whatsapp' | 'email',
  ) => Promise<void>;
}

export const BatchInviteModal: React.FC<BatchInviteModalProps> = ({
  isOpen,
  onClose,
  offlineMembers,
  onBatchInvite,
}) => {
  const { t } = useTranslation(['access', 'common']);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === offlineMembers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(offlineMembers.map((m) => m.id));
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setIsSending(true);
    try {
      await onBatchInvite(selectedIds, channel);
      setSelectedIds([]);
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  const isAllSelected =
    offlineMembers.length > 0 && selectedIds.length === offlineMembers.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[560px] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
              <PaperPlaneTilt size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e1b19]">
                {t(
                  'access:modals.batchInviteTitle',
                  'Batch Onboard Community Members',
                )}
              </h2>
              <p className="text-xs text-[#8a726a] mt-0.5">
                {t('access:modals.batchInviteSubtitle') ||
                  'Select offline members to grant platform access and dispatch temporary credentials'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="px-6 py-4 bg-[#faf2ee] border-b border-[#e8e1dd] flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
            {t('access:modals.selectChannel') || 'Dispatch Channel'}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                channel === 'whatsapp'
                  ? 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2] shadow-xs'
                  : 'bg-white text-[#8a726a] border-[#e8e1dd] hover:bg-[#f4ece9]'
              }`}
            >
              <ChatCircleText size={16} weight="fill" />
              <span>WhatsApp Direct Message</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                channel === 'email'
                  ? 'bg-[#fff2ee] text-[#b85028] border-[#ffdbcf] shadow-xs'
                  : 'bg-white text-[#8a726a] border-[#e8e1dd] hover:bg-[#f4ece9]'
              }`}
            >
              <EnvelopeSimple size={16} weight="fill" />
              <span>Email Address</span>
            </button>
          </div>
        </div>

        {/* Members Selection List */}
        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-[#57423b]">
              {selectedIds.length} of {offlineMembers.length} selected
            </span>
            {offlineMembers.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-bold text-[#b85028] hover:underline cursor-pointer"
              >
                {isAllSelected ? 'Deselect All' : 'Select All Offline'}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
            {offlineMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8a726a]">
                All members in this hub already have platform access credentials
                granted!
              </div>
            ) : (
              offlineMembers.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#fff8f5] border-[#b85028]'
                        : 'bg-white border-[#e8e1dd] hover:bg-[#faf2ee]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-[#b85028] border-[#b85028] text-white'
                            : 'border-[#cfc4be] bg-white'
                        }`}
                      >
                        {isSelected && <Check size={11} weight="bold" />}
                      </div>
                      <UserAvatar
                        avatarUrl={m.avatarUrl}
                        name={m.fullName}
                        size="sm"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#1e1b19]">
                          {m.fullName}
                        </div>
                        <div className="text-[11px] text-[#8a726a] font-mono">
                          {formatCameroonPhone(m.phoneNumber)}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                      {m.homeTown?.code ?? 'HUB'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex items-center justify-between">
          <span className="text-xs text-[#8a726a]">
            Temporary code expires in 48h
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] cursor-pointer"
            >
              {t('common:cancel')}
            </button>
            <button
              type="button"
              disabled={isSending || selectedIds.length === 0}
              onClick={handleSend}
              className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <PaperPlaneTilt size={15} weight="bold" />
              <span>
                {isSending
                  ? 'Dispatching...'
                  : `Dispatch ${selectedIds.length} Invites`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
