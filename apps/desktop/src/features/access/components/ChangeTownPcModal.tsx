import {
  useAuth,
  useChangeTownPcMutation,
  useMembersQuery,
  useTownContext,
  useTownsQuery,
  useTranslation,
} from '@jrs/client-core';
import { type IUser, UserRole } from '@jrs/shared';
import {
  ArrowRight,
  ArrowsLeftRight,
  CheckCircle,
  Crown,
  Prohibit,
  Users,
  Warning,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  CustomSelect,
  type SelectOption,
  UserAvatar,
} from '../../../components';
import {
  calculateAge,
  formatCameroonPhone,
} from '../../members/utils/member-ui.utils';

interface ChangeTownPcModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTownId?: string;
  targetOutgoingPc?: IUser | null;
  onSuccess?: () => void;
}

export const ChangeTownPcModal: React.FC<ChangeTownPcModalProps> = ({
  isOpen,
  onClose,
  targetTownId,
  targetOutgoingPc,
  onSuccess,
}) => {
  const { t } = useTranslation(['access', 'members', 'common']);
  const { user: currentUser } = useAuth();
  const { activeTownId } = useTownContext();

  const isAP = currentUser?.role === UserRole.AP;

  // Selected Town
  const [selectedTownId, setSelectedTownId] = useState<string>(
    targetTownId || activeTownId || '',
  );

  // Form State
  const [outgoingPcId, setOutgoingPcId] = useState<string>('');
  const [newPcId, setNewPcId] = useState<string>('');
  const [disposition, setDisposition] = useState<
    'demote_to_member' | 'revoke_access'
  >('demote_to_member');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: towns = [] } = useTownsQuery();
  const changeTownPcMutation = useChangeTownPcMutation();

  // Query all members in selected town to find candidates & active PCs
  const { data: townMembersResponse } = useMembersQuery(
    {
      townId: selectedTownId || undefined,
      limit: 150,
    },
    { enabled: !!selectedTownId },
  );

  const townMembers = useMemo(() => {
    return townMembersResponse?.items || [];
  }, [townMembersResponse]);

  // Current active PCs in selected town
  const activePcs = useMemo(() => {
    return townMembers.filter(
      (m) =>
        m.role === UserRole.PC && m.isActivePC && !m.account?.isAccessRevoked,
    );
  }, [townMembers]);

  // Eligible new PC candidates (Members in this town, aged 18-30, not already active PC)
  const candidateMembers = useMemo(() => {
    return townMembers.filter((m) => {
      if (m.role === UserRole.PC && m.isActivePC) return false;
      if (m.id === outgoingPcId) return false;
      const age = calculateAge(m.dateOfBirth);
      if (age !== null && (age < 18 || age > 30)) return false;
      return true;
    });
  }, [townMembers, outgoingPcId]);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      const town = targetTownId || activeTownId || (towns[0]?.id ?? '');
      setSelectedTownId(town);
      setOutgoingPcId(targetOutgoingPc?.id || '');
      setNewPcId('');
      setDisposition('demote_to_member');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, targetTownId, targetOutgoingPc, activeTownId, towns]);

  // If town has 1 active PC and no outgoing PC was preselected, default to that PC
  useEffect(() => {
    if (!outgoingPcId && activePcs.length === 1 && activePcs[0]) {
      setOutgoingPcId(activePcs[0].id);
    }
  }, [activePcs, outgoingPcId]);

  if (!isOpen) return null;

  const currentTown = towns.find((t) => t.id === selectedTownId);
  const outgoingMember = townMembers.find((m) => m.id === outgoingPcId);
  const newPcMember = townMembers.find((m) => m.id === newPcId);

  // Town Options
  const townOptions: SelectOption[] = towns.map((town) => ({
    value: town.id,
    label: `${town.name} (${town.code})`,
  }));

  // Candidate Options
  const candidateOptions: SelectOption[] = candidateMembers.map((member) => {
    const age = calculateAge(member.dateOfBirth);
    return {
      value: member.id,
      label: member.fullName,
      description: `Age: ${age ?? '—'} • ${member.account?.hasAppAccess ? 'Has App Access' : 'Offline Member'}`,
    };
  });

  // Outgoing PC Options
  const outgoingOptions: SelectOption[] = [
    {
      value: '',
      label: 'None / Appoint Additional PC (if town quota has room)',
    },
    ...activePcs.map((pc) => ({
      value: pc.id,
      label: `${pc.fullName} (Active PC)`,
    })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTownId) {
      setErrorMsg('Please select a town hub.');
      return;
    }
    if (!newPcId) {
      setErrorMsg(
        'Please select a member to promote to Program Coordinator (PC).',
      );
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await changeTownPcMutation.mutateAsync({
        townId: selectedTownId,
        newPcUserId: newPcId,
        outgoingPcUserId: outgoingPcId || undefined,
        outgoingPcDisposition: outgoingPcId ? disposition : undefined,
      });

      setSuccessMsg(res.message);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1400);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to transition PC leadership.',
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[560px] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
              <Crown size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e1b19]">
                Transition Town PC Leadership
              </h2>
              <p className="text-xs text-[#8a726a] mt-0.5">
                Appoint a new Program Coordinator and adjust the outgoing
                coordinator's permissions.
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#ffdad6] border border-[#ffb4a8] text-[#ba1a1a] text-xs font-semibold flex items-center gap-2">
              <Warning size={18} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-lg bg-[#c2e9ca] border border-[#a9d0b2] text-[#2c4e37] text-xs font-semibold flex items-center gap-2">
              <CheckCircle size={18} weight="fill" className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Town Selection (if AP has multi-town oversight) */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="target-town-select"
              className="text-xs font-bold text-[#57423b]"
            >
              Community Hub / Town
            </label>
            {isAP ? (
              <CustomSelect
                id="target-town-select"
                value={selectedTownId}
                onChange={(val) => {
                  setSelectedTownId(val);
                  setOutgoingPcId('');
                  setNewPcId('');
                }}
                options={townOptions}
                placeholder="Select community hub..."
                variant="form"
                size="sm"
                className="w-full"
              />
            ) : (
              <div className="p-2.5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-xs font-bold text-[#1e1b19] flex items-center justify-between">
                <span>{currentTown?.name || 'Current Town'}</span>
                <span className="font-mono text-[10px] text-[#8a726a]">
                  {currentTown?.code}
                </span>
              </div>
            )}
          </div>

          {/* 1. Outgoing PC Selection */}
          <div className="p-4 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider flex items-center gap-1.5">
                <ArrowsLeftRight size={14} className="text-[#b85028]" />
                Outgoing Coordinator (Stepping Down)
              </span>
              <span className="text-[11px] text-[#8a726a]">
                Active PCs: {activePcs.length} / 2
              </span>
            </div>

            {activePcs.length === 0 ? (
              <p className="text-xs text-[#8a726a] italic py-1">
                This town currently has no active Contact Persons. You can
                appoint one directly.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <CustomSelect
                  id="outgoing-pc-select"
                  value={outgoingPcId}
                  onChange={(val) => setOutgoingPcId(val)}
                  options={outgoingOptions}
                  placeholder="Select outgoing coordinator..."
                  variant="form"
                  size="sm"
                  className="w-full"
                />

                {/* Disposition Radio Options */}
                {outgoingPcId && (
                  <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[#e8e1dd]">
                    <span className="text-xs font-bold text-[#57423b]">
                      Action for Outgoing PC ({outgoingMember?.fullName}):
                    </span>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#e8e1dd] bg-white hover:bg-[#fff8f5] transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="outgoing-disposition"
                        checked={disposition === 'demote_to_member'}
                        onChange={() => setDisposition('demote_to_member')}
                        className="mt-0.5 text-[#b85028] focus:ring-[#b85028]"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#1e1b19] flex items-center gap-1.5">
                          <Users size={14} className="text-[#486b52]" />
                          Demote to Regular Member (Keep App Access)
                        </span>
                        <span className="text-[11px] text-[#8a726a] mt-0.5">
                          Remains an active member of this town and keeps login
                          credentials to browse activities.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#e8e1dd] bg-white hover:bg-[#fff8f5] transition-colors cursor-pointer">
                      <input
                        type="radio"
                        name="outgoing-disposition"
                        checked={disposition === 'revoke_access'}
                        onChange={() => setDisposition('revoke_access')}
                        className="mt-0.5 text-[#ba1a1a] focus:ring-[#ba1a1a]"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#ba1a1a] flex items-center gap-1.5">
                          <Prohibit size={14} />
                          Revoke App Access Completely
                        </span>
                        <span className="text-[11px] text-[#8a726a] mt-0.5">
                          Demotes to member and immediately suspends portal
                          login access and invalidates tokens.
                        </span>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. New PC Promotion */}
          <div className="p-4 rounded-xl bg-white border border-[#e8e1dd] shadow-2xs flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider flex items-center gap-1.5">
              <Crown size={14} className="text-[#b85028]" />
              New Program Coordinator (To Appoint)
            </span>

            <CustomSelect
              id="new-pc-select"
              value={newPcId}
              onChange={(val) => setNewPcId(val)}
              options={candidateOptions}
              placeholder="Select eligible member to promote to PC..."
              variant="form"
              size="sm"
              className="w-full"
            />

            {newPcMember && (
              <div className="p-3 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    avatarUrl={newPcMember.avatarUrl}
                    name={newPcMember.fullName}
                    size="sm"
                  />
                  <div>
                    <span className="font-bold text-[#1e1b19] block">
                      {newPcMember.fullName}
                    </span>
                    <span className="text-[11px] text-[#8a726a]">
                      Age: {calculateAge(newPcMember.dateOfBirth) ?? '—'} •
                      Phone: {formatCameroonPhone(newPcMember.phoneNumber)}
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c2e9ca] text-[#2c4e37]">
                  Eligible (18-30)
                </span>
              </div>
            )}
          </div>

          {/* Transition Summary Preview */}
          {newPcMember && (
            <div className="p-3.5 rounded-lg bg-[#fff8f5] border border-[#ffdbcf] text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-[#57423b] truncate">
                  {outgoingMember ? outgoingMember.fullName : 'Additional PC'}
                </span>
                <ArrowRight size={14} className="text-[#b85028] shrink-0" />
                <span className="font-bold text-[#b85028] truncate">
                  {newPcMember.fullName}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffdbcf] text-[#812901] shrink-0">
                {disposition === 'revoke_access' && outgoingMember
                  ? 'Access Revoked'
                  : 'Member Kept'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4ece9]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-xs font-bold text-[#57423b] cursor-pointer"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={changeTownPcMutation.isPending || !newPcId}
              className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {changeTownPcMutation.isPending ? (
                <span>{t('common:loading')}</span>
              ) : (
                <>
                  <Crown size={15} weight="bold" />
                  <span>Transfer Leadership</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
