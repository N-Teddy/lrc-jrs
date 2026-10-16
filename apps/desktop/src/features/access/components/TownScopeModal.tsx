import { useTranslation } from '@jrs/client-core';
import type { ITown, IUser } from '@jrs/shared';
import { Check, Globe, X } from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { UserAvatar } from '../../../components';

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setSelectedIds(member.account?.allowedReadTownIds || []);
    }
  }, [member]);

  if (!isOpen || !member) return null;

  const homeTownId = member.homeTownId;
  const externalTowns = availableTowns.filter((town) => town.id !== homeTownId);

  const toggleTown = (townId: string) => {
    setSelectedIds((prev) =>
      prev.includes(townId)
        ? prev.filter((id) => id !== townId)
        : [...prev, townId],
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveScopes(member.id, selectedIds);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[500px] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
              <Globe size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e1b19]">
                {t('access:modals.scopesTitle') || 'Cross-Hub Read Scopes'}
              </h2>
              <p className="text-xs text-[#8a726a] mt-0.5">
                {t('access:modals.scopesSubtitle', { name: member.fullName }) ||
                  `Grant ${member.fullName} read-only access to browse external parish gathering rosters`}
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

        {/* Member Strip */}
        <div className="px-6 py-3.5 bg-[#faf2ee] border-b border-[#e8e1dd] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatarUrl={member.avatarUrl}
              name={member.fullName}
              size="md"
            />
            <div>
              <div className="text-xs font-bold text-[#1e1b19]">
                {member.fullName}
              </div>
              <div className="text-[11px] text-[#8a726a] flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold">{member.role}</span>
                <span>•</span>
                <span>Home Hub: {member.homeTown?.name ?? 'Assigned Hub'}</span>
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f4ece9] text-[#57423b]">
            {member.homeTown?.code ?? 'HUB'}
          </span>
        </div>

        {/* Towns Checkbox List */}
        <div className="p-6 flex flex-col gap-3 max-h-[340px] overflow-y-auto">
          <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
            Available External Hubs
          </span>

          {externalTowns.length === 0 ? (
            <p className="text-xs text-[#8a726a] py-4 text-center">
              No external hubs registered.
            </p>
          ) : (
            externalTowns.map((town) => {
              const isChecked = selectedIds.includes(town.id);
              return (
                <div
                  key={town.id}
                  onClick={() => toggleTown(town.id)}
                  className={`p-3.5 rounded-lg border flex items-center justify-between transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-[#fff8f5] border-[#b85028] shadow-2xs'
                      : 'bg-white border-[#e8e1dd] hover:bg-[#faf2ee]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-[#b85028] border-[#b85028] text-white'
                          : 'border-[#cfc4be] bg-white'
                      }`}
                    >
                      {isChecked && <Check size={13} weight="bold" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1e1b19]">
                        {town.name}
                      </div>
                      <div className="text-[11px] text-[#8a726a]">
                        Hub Hub Jurisdiction · Read-only audit access
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                    {town.code}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex items-center justify-between">
          <span className="text-xs text-[#8a726a] font-medium">
            {selectedIds.length} external hub(s) granted
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
                : t('access:modals.saveScopes') || 'Save Scope Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
