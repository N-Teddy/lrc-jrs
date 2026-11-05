import { useTranslation } from '@jrs/client-core';
import type { ITown, IUser } from '@jrs/shared';
import {
  Check,
  CheckSquare,
  Globe,
  Lock,
  MagnifyingGlass,
  ShieldCheck,
  Square,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { UserAvatar } from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';

interface TownScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: IUser | null;
  availableTowns: ITown[];
  onSaveScopes: (memberId: string, allowedTownIds: string[]) => Promise<void>;
}

export const TownScopeModal: React.FC<TownScopeModalProps> = ({
  isOpen,
  onClose,
  member,
  availableTowns,
  onSaveScopes,
}) => {
  const { t } = useTranslation(['access', 'common']);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedIds(member.account?.allowedReadTownIds || []);
      setSearchQuery('');
    }
  }, [member]);

  const homeTownId = member?.homeTownId;
  const homeTown = useMemo(() => {
    if (!homeTownId) return null;
    return (
      member?.homeTown ||
      availableTowns.find((town) => town.id === homeTownId) ||
      null
    );
  }, [member, homeTownId, availableTowns]);

  const externalTowns = useMemo(() => {
    return availableTowns.filter((town) => town.id !== homeTownId);
  }, [availableTowns, homeTownId]);

  const filteredExternalTowns = useMemo(() => {
    if (!searchQuery.trim()) return externalTowns;
    const q = searchQuery.toLowerCase().trim();
    return externalTowns.filter(
      (town) =>
        town.name.toLowerCase().includes(q) ||
        town.code.toLowerCase().includes(q),
    );
  }, [externalTowns, searchQuery]);

  if (!isOpen || !member) return null;

  const toggleTown = (townId: string) => {
    if (townId === homeTownId) return; // Protected: home town cannot be toggled
    setSelectedIds((prev) =>
      prev.includes(townId)
        ? prev.filter((id) => id !== townId)
        : [...prev, townId],
    );
  };

  const isAllFilteredSelected =
    filteredExternalTowns.length > 0 &&
    filteredExternalTowns.every((t) => selectedIds.includes(t.id));

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredExternalTowns.map((t) => t.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      const newIds = new Set(selectedIds);
      for (const t of filteredExternalTowns) {
        newIds.add(t.id);
      }
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure home town is excluded from external scopes array to prevent duplicate assignment
      const finalScopes = selectedIds.filter((id) => id !== homeTownId);
      await onSaveScopes(member.id, finalScopes);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
              <Globe size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e1b19]">
                {t('access:modals.scopesTitle', 'Cross-Hub Read Scopes')}
              </h2>
              <p className="text-xs text-[#8a726a] mt-0.5">
                {t('access:modals.scopesSubtitle', {
                  name: member.fullName,
                  defaultValue: `Configure read-only access for ${member.fullName} across external hub jurisdictions`,
                })}
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

        {/* Member Profile Strip */}
        <div className="px-6 py-3.5 bg-[#faf2ee] border-b border-[#e8e1dd] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              avatarUrl={member.avatarUrl}
              name={member.fullName}
              size="md"
            />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#1e1b19] truncate">
                {member.fullName}
              </div>
              <div className="text-[11px] text-[#8a726a] flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-semibold">{member.role}</span>
                <span>•</span>
                <span className="font-mono">
                  {formatCameroonPhone(member.phoneNumber)}
                </span>
                <span>•</span>
                <span>Home Hub: {homeTown?.name ?? 'Assigned Base Hub'}</span>
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#f4ece9] text-[#57423b] border border-[#e8e1dd] shrink-0">
            {homeTown?.code ?? 'HUB'}
          </span>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto min-h-0">
          {/* Section 1: Assigned Base Hub (Protected & Pre-selected) */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#486b52]" />
              Assigned Base Jurisdiction (Protected)
            </span>

            {homeTown ? (
              <div className="p-3.5 rounded-lg border border-[#c2e9ca] bg-[#f4f9f5] flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-5 h-5 rounded-md bg-[#486b52] text-white flex items-center justify-center shrink-0 cursor-not-allowed shadow-2xs"
                    title="Permanent primary assignment - protected against removal"
                  >
                    <Check size={12} weight="bold" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1e1b19] flex items-center gap-1.5">
                      <span>{homeTown.name}</span>
                      <Lock size={12} className="text-[#486b52]" />
                    </div>
                    <div className="text-[11px] text-[#486b52]">
                      Primary assigned hub • Full member permissions • Protected
                      against accidental removal
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#edf3ee] text-[#2c4e37] border border-[#c2e9ca]">
                    Primary Base (Locked)
                  </span>
                  <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-white text-[#57423b] border border-[#c2e9ca]">
                    {homeTown.code}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-[#e8e1dd] bg-[#faf2ee] text-xs text-[#8a726a]">
                No base town assigned to this user profile.
              </div>
            )}
          </div>

          {/* Section 2: External Hub Read Scopes */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                Additional Cross-Hub Read Scopes
              </span>
              {filteredExternalTowns.length > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAllFiltered}
                  className="text-xs font-bold text-[#b85028] hover:underline cursor-pointer flex items-center gap-1.5"
                >
                  {isAllFilteredSelected ? (
                    <>
                      <Square size={13} />
                      <span>Deselect All</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare size={13} weight="bold" />
                      <span>
                        Select All Filtered ({filteredExternalTowns.length})
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Hub Search Input */}
            <div className="relative flex items-center">
              <MagnifyingGlass
                size={15}
                className="absolute left-3 text-[#8a726a] pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter external hubs by name or hub code..."
                className="w-full pl-8.5 pr-8 py-1.5 rounded-lg bg-[#faf2ee] focus:bg-white border border-[#e8e1dd] focus:border-[#b85028] focus:ring-2 focus:ring-[#b85028]/20 text-xs text-[#1e1b19] placeholder:text-[#8a726a] transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-[#8a726a] hover:text-[#1e1b19] p-0.5 rounded cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* External Hubs Checkbox List */}
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {externalTowns.length === 0 ? (
                <p className="text-xs text-[#8a726a] py-6 text-center">
                  No other external community hubs registered in the system.
                </p>
              ) : filteredExternalTowns.length === 0 ? (
                <p className="text-xs text-[#8a726a] py-6 text-center">
                  No external hubs match "{searchQuery}".
                </p>
              ) : (
                filteredExternalTowns.map((town) => {
                  const isChecked = selectedIds.includes(town.id);
                  return (
                    <div
                      key={town.id}
                      onClick={() => toggleTown(town.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-[#fff8f5] border-[#b85028] shadow-2xs'
                          : 'bg-white border-[#e8e1dd] hover:bg-[#faf2ee]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                            isChecked
                              ? 'bg-[#b85028] border-[#b85028] text-white'
                              : 'border-[#cfc4be] bg-white'
                          }`}
                        >
                          {isChecked && <Check size={12} weight="bold" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#1e1b19] truncate">
                            {town.name}
                          </div>
                          <div className="text-[11px] text-[#8a726a]">
                            External Hub Jurisdiction • Read-only activity &
                            roster audit
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd] shrink-0">
                        {town.code}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#8a726a] font-medium">
            {selectedIds.filter((id) => id !== homeTownId).length} external
            hub(s) granted read scope
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
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving
                ? t('common:loading')
                : t('access:modals.saveScopes', 'Save Scope Permissions')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
