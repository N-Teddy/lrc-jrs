import { useTranslation } from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ChatCircleText,
  Check,
  CheckSquare,
  EnvelopeSimple,
  MagnifyingGlass,
  PaperPlaneTilt,
  Square,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { UserAvatar } from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';

interface BatchInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  offlineMembers?: IUser[];
  activeTownId?: string;
  onBatchInvite: (
    memberIds: string[],
    channel: 'whatsapp' | 'email',
  ) => Promise<void>;
}

export const BatchInviteModal: React.FC<BatchInviteModalProps> = ({
  isOpen,
  onClose,
  offlineMembers = [],
  onBatchInvite,
}) => {
  const { t } = useTranslation(['access', 'common']);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isSending, setIsSending] = useState(false);

  // Filter members dynamically based on search query
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return offlineMembers;
    const q = searchQuery.toLowerCase().trim();
    return offlineMembers.filter((m) => {
      const nameMatch = (m.fullName ?? '').toLowerCase().includes(q);
      const phoneMatch = (m.phoneNumber ?? '').toLowerCase().includes(q);
      const emailMatch = (m.email ?? '').toLowerCase().includes(q);
      const townMatch =
        (m.homeTown?.name ?? '').toLowerCase().includes(q) ||
        (m.homeTown?.code ?? '').toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || townMatch;
    });
  }, [offlineMembers, searchQuery]);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const isAllFilteredSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.includes(m.id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredMembers.map((m) => m.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const newIds = new Set(selectedIds);
      for (const m of filteredMembers) {
        newIds.add(m.id);
      }
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;
    setIsSending(true);
    try {
      await onBatchInvite(selectedIds, channel);
      setSelectedIds([]);
      setSearchQuery('');
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-xl border border-[#e8e1dd]/80 shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[780px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#f4ece9] flex items-start justify-between shrink-0 bg-gradient-to-r from-white via-white to-[#faf2ee]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
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
                {t(
                  'access:modals.batchInviteSubtitle',
                  'Select offline members to grant platform access and dispatch temporary credentials',
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd]/80 flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="px-6 py-3 bg-[#faf2ee]/70 border-b border-[#f4ece9] flex flex-col gap-2 shrink-0">
          <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
            {t('access:modals.selectChannel', 'Dispatch Channel')}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-xs font-bold transition-all cursor-pointer ${
                channel === 'whatsapp'
                  ? 'bg-[#c2e9ca] text-[#2c4e37] border-[#a9d0b2] shadow-xs'
                  : 'bg-white text-[#8a726a] border-[#e8e1dd]/80 hover:bg-[#f4ece9]'
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
                  : 'bg-white text-[#8a726a] border-[#e8e1dd]/80 hover:bg-[#f4ece9]'
              }`}
            >
              <EnvelopeSimple size={16} weight="fill" />
              <span>Email Address</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Batch Filter Controls */}
        <div className="px-6 pt-4 pb-2 flex flex-col gap-3 shrink-0">
          <div className="relative flex items-center">
            <MagnifyingGlass
              size={18}
              className="absolute left-3.5 text-[#8a726a] pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(
                'access:modals.searchMembersPlaceholder',
                'Search offline members by name, phone number, or hub...',
              )}
              className="w-full h-11 pl-10 pr-10 rounded-lg bg-[#faf2ee]/70 focus:bg-white border border-[#e8e1dd]/80 focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/15 text-xs sm:text-sm font-medium text-[#1e1b19] placeholder:text-[#8a726a] transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#8a726a] hover:text-[#1e1b19] p-1 rounded cursor-pointer transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[#57423b]">
              <span className="font-bold">
                {selectedIds.length} {t('common:selected', 'selected')}
              </span>
              <span className="text-[#b09e97]">•</span>
              <span className="text-[#8a726a]">
                {filteredMembers.length === offlineMembers.length
                  ? `${offlineMembers.length} offline members`
                  : `Showing ${filteredMembers.length} of ${offlineMembers.length}`}
              </span>
            </div>
            {filteredMembers.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="font-bold text-[#b85028] hover:underline cursor-pointer flex items-center gap-1.5"
              >
                {isAllFilteredSelected ? (
                  <>
                    <Square size={13} />
                    <span>Deselect All</span>
                  </>
                ) : (
                  <>
                    <CheckSquare size={13} weight="bold" />
                    <span>Select All Filtered ({filteredMembers.length})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Members Selection List */}
        <div className="px-6 py-2 flex-1 overflow-y-auto min-h-0">
          <div className="flex flex-col gap-2 min-h-[340px] pr-1">
            {offlineMembers.length === 0 && !searchQuery.trim() ? (
              <div className="py-16 text-center text-xs text-[#8a726a]">
                {t(
                  'access:modals.allMembersOnboarded',
                  'All members in this hub already have platform access credentials granted!',
                )}
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#8a726a]">
                No offline members match "{searchQuery}".
              </div>
            ) : (
              filteredMembers.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#fff8f5] border-[#b85028] shadow-2xs'
                        : 'bg-white border-[#f0eae7] hover:border-[#b85028]/40 hover:bg-[#faf2ee]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
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
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1e1b19] truncate">
                          {m.fullName}
                        </div>
                        <div className="text-[11px] text-[#8a726a] font-mono">
                          {formatCameroonPhone(m.phoneNumber)}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]/70 shrink-0">
                      {m.homeTown?.code ?? 'HUB'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf2ee]/80 border-t border-[#f4ece9] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#8a726a]">
            Temporary code expires in 48h
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-white border border-[#e8e1dd]/80 text-xs font-bold text-[#57423b] hover:bg-[#f4ece9] cursor-pointer transition-colors"
            >
              {t('common:cancel')}
            </button>
            <button
              type="button"
              disabled={isSending || selectedIds.length === 0}
              onClick={handleSend}
              className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer active:scale-[0.98]"
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
