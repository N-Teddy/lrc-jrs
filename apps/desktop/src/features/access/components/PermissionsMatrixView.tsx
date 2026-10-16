import { useTranslation } from '@jrs/client-core';
import type { ITown, IUser } from '@jrs/shared';
import {
  CheckCircle,
  Eye,
  Globe,
  PencilSimple,
  ShieldCheck,
  UserCheck,
  Users,
  XCircle,
} from '@phosphor-icons/react';
import type React from 'react';
import { UserAvatar } from '../../../components';

interface PermissionsMatrixViewProps {
  members: IUser[];
  availableTowns: ITown[];
  onOpenScopeModal: (member: IUser) => void;
  isCurrentUserAp: boolean;
}

export const PermissionsMatrixView: React.FC<PermissionsMatrixViewProps> = ({
  members,
  availableTowns,
  onOpenScopeModal,
  isCurrentUserAp,
}) => {
  const { t } = useTranslation(['access', 'common']);

  // Find all members who have external town scopes delegated
  const delegatedMembers = members.filter(
    (m) =>
      m.account?.allowedReadTownIds && m.account.allowedReadTownIds.length > 0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Role Hierarchy Cards */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-[#1e1b19]">
            {t('access:permissions.title') || 'Role & Hierarchy Governance'}
          </h3>
          <p className="text-xs text-[#8a726a] mt-0.5">
            {t('access:permissions.subtitle') ||
              'Overview of permission boundaries across diocesan ranks'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* AP Card */}
          <div className="bg-white rounded-3xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#5c1d24] text-white">
                  AP
                </span>
                <ShieldCheck
                  size={24}
                  className="text-[#5c1d24]"
                  weight="duotone"
                />
              </div>
              <p className="text-xs text-[#57423b] leading-relaxed mb-4">
                Full executive diocesan authority. Permitted to oversee, create,
                reschedule, delete, and delegate accounts across all Cameroon
                hubs.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Inter-Hub Multi-Hub Write Access</span>
                </div>
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Member Account Grant & Suspension</span>
                </div>
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Cross-Town Scope Delegation</span>
                </div>
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Permanent Registry Archival</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#f4ece9] text-[11px] font-bold text-[#8a726a]">
              Inter-Hub Clergy & Senior Directors
            </div>
          </div>

          {/* PC Card */}
          <div className="bg-white rounded-3xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#2c4e37] text-white">
                  PC
                </span>
                <UserCheck
                  size={24}
                  className="text-[#2c4e37]"
                  weight="duotone"
                />
              </div>
              <p className="text-xs text-[#57423b] leading-relaxed mb-4">
                Hub administrator. Full management authority inside their
                assigned home hub, with read-only auditing into delegated
                external hubs.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Home Hub Full Write Access</span>
                </div>
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Attendance Roster Finalization</span>
                </div>
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Delegated Read-Only External Hubs</span>
                </div>
                <div className="flex items-center gap-2 text-[#8a726a]">
                  <XCircle size={15} />
                  <span>Cannot Delete Registry Members</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#f4ece9] text-[11px] font-bold text-[#8a726a]">
              Hub Leaders & Youth Pastors
            </div>
          </div>

          {/* Youth Member Card */}
          <div className="bg-white rounded-3xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                  Youth Member
                </span>
                <Users size={24} className="text-[#8a726a]" weight="duotone" />
              </div>
              <p className="text-xs text-[#57423b] leading-relaxed mb-4">
                Fellowship participants. Access personal profile, view upcoming
                parish activities, and track chronological attendance record.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Personal Attendance History</span>
                </div>
                <div className="flex items-center gap-2 text-[#2c4e37]">
                  <CheckCircle size={15} weight="fill" />
                  <span>Home Hub Gatherings Calendar</span>
                </div>
                <div className="flex items-center gap-2 text-[#8a726a]">
                  <XCircle size={15} />
                  <span>No Administrative Roster Editing</span>
                </div>
                <div className="flex items-center gap-2 text-[#8a726a]">
                  <XCircle size={15} />
                  <span>No Access Management</span>
                </div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#f4ece9] text-[11px] font-bold text-[#8a726a]">
              Active Fellowship Youth Cohort
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cross-Hub Scope Delegations Section */}
      <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#e8e1dd] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
              <Globe size={18} className="text-[#b85028]" />
              <span>Cross-Hub Read Scopes & Jurisdictions</span>
            </h3>
            <p className="text-xs text-[#8a726a] mt-0.5">
              Hub coordinators and officers granted read-only visibility into
              other parish gatherings
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
            {delegatedMembers.length} active delegations
          </span>
        </div>

        {delegatedMembers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8a726a]">
            No members currently have cross-town read scopes assigned. All
            members are strictly restricted to their home hubs.
          </div>
        ) : (
          <div className="divide-y divide-[#f4ece9]">
            {delegatedMembers.map((m) => {
              const allowedTowns = (m.account?.allowedReadTownIds || [])
                .map((id) => availableTowns.find((t) => t.id === id))
                .filter(Boolean) as ITown[];

              return (
                <div
                  key={m.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-[#fffbf9] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatarUrl={m.avatarUrl}
                      name={m.fullName}
                      size="md"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#1e1b19] flex items-center gap-2">
                        <span>{m.fullName}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#2c4e37] text-white">
                          {m.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8a726a] mt-0.5">
                        Home Hub: <strong>{m.homeTown?.name ?? '—'}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-[#8a726a]">
                        Granted External Hubs
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {allowedTowns.map((town) => (
                          <span
                            key={town.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-[#eef7f0] text-[#2c4e37] border border-[#c2e9ca]"
                          >
                            <Eye size={12} weight="bold" />
                            <span>{town.code}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {isCurrentUserAp && (
                      <button
                        type="button"
                        onClick={() => onOpenScopeModal(m)}
                        className="px-3 py-1.5 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-xs font-bold text-[#57423b] flex items-center gap-1.5 cursor-pointer"
                      >
                        <PencilSimple size={13} />
                        <span>Edit Scopes</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
