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

interface RoleSummaryConfig {
  badge: string;
  badgeClass: string;
  icon: React.ElementType;
  iconColor: string;
  titleKey: string;
  descriptionKey: string;
  footerKey: string;
  permissions: { textKey: string; defaultText: string; allowed: boolean }[];
}

const ROLE_SUMMARIES: RoleSummaryConfig[] = [
  {
    badge: 'AP',
    badgeClass: 'bg-[#5c1d24] text-white',
    icon: ShieldCheck,
    iconColor: 'text-[#5c1d24]',
    titleKey: 'access:permissions.apRole',
    descriptionKey: 'access:permissions.apDesc',
    footerKey: 'access:permissions.apFooter',
    permissions: [
      {
        textKey: 'access:permissions.permInterHubWrite',
        defaultText: 'Inter-Hub Multi-Hub Write Access',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permAccountGrant',
        defaultText: 'Member Account Grant & Suspension',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permScopeDelegation',
        defaultText: 'Cross-Town Scope Delegation',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permRegistryArchival',
        defaultText: 'Permanent Registry Archival',
        allowed: true,
      },
    ],
  },
  {
    badge: 'PC',
    badgeClass: 'bg-[#2c4e37] text-white',
    icon: UserCheck,
    iconColor: 'text-[#2c4e37]',
    titleKey: 'access:permissions.pcRole',
    descriptionKey: 'access:permissions.pcDesc',
    footerKey: 'access:permissions.pcFooter',
    permissions: [
      {
        textKey: 'access:permissions.permHomeHubWrite',
        defaultText: 'Home Hub Full Write Access',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permAttendanceFinalize',
        defaultText: 'Attendance Roster Finalization',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permDelegatedReadOnly',
        defaultText: 'Delegated Read-Only External Hubs',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permCannotDeleteMembers',
        defaultText: 'Cannot Delete Registry Members',
        allowed: false,
      },
    ],
  },
  {
    badge: 'Youth Member',
    badgeClass: 'bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]',
    icon: Users,
    iconColor: 'text-[#8a726a]',
    titleKey: 'access:permissions.memberRole',
    descriptionKey: 'access:permissions.memberDesc',
    footerKey: 'access:permissions.memberFooter',
    permissions: [
      {
        textKey: 'access:permissions.permPersonalAttendance',
        defaultText: 'Personal Attendance History',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permHomeGatherings',
        defaultText: 'Home Hub Gatherings Calendar',
        allowed: true,
      },
      {
        textKey: 'access:permissions.permNoRosterEditing',
        defaultText: 'No Administrative Roster Editing',
        allowed: false,
      },
      {
        textKey: 'access:permissions.permNoAccessManagement',
        defaultText: 'No Access Management',
        allowed: false,
      },
    ],
  },
];

// fallow-ignore-next-line unused-export
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
            {t('access:permissions.title', 'Role & Hierarchy Governance')}
          </h3>
          <p className="text-xs text-[#8a726a] mt-0.5">
            {t(
              'access:permissions.subtitle',
              'Overview of permission boundaries across diocesan ranks',
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLE_SUMMARIES.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.badge}
                className="bg-white rounded-xl border border-[#e8e1dd] p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${role.badgeClass}`}
                    >
                      {t(role.titleKey, role.badge)}
                    </span>
                    <Icon
                      size={24}
                      className={role.iconColor}
                      weight="duotone"
                    />
                  </div>
                  <p className="text-xs text-[#57423b] leading-relaxed mb-4">
                    {t(role.descriptionKey)}
                  </p>
                  <div className="space-y-2 text-xs">
                    {role.permissions.map((p) => (
                      <div
                        key={p.textKey}
                        className={`flex items-center gap-2 ${
                          p.allowed ? 'text-[#2c4e37]' : 'text-[#8a726a]'
                        }`}
                      >
                        {p.allowed ? (
                          <CheckCircle size={15} weight="fill" />
                        ) : (
                          <XCircle size={15} />
                        )}
                        <span>{t(p.textKey, p.defaultText)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-[#f4ece9] text-[11px] font-bold text-[#8a726a]">
                  {t(role.footerKey)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Cross-Hub Scope Delegations Section */}
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
        <div className="p-6 border-b border-[#e8e1dd] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1e1b19] flex items-center gap-2">
              <Globe size={18} className="text-[#b85028]" />
              <span>
                {t(
                  'access:permissions.interHubDelegations',
                  'Cross-Hub Read Scopes & Jurisdictions',
                )}
              </span>
            </h3>
            <p className="text-xs text-[#8a726a] mt-0.5">
              {t(
                'access:permissions.interHubSubtitle',
                'Hub coordinators and officers granted read-only visibility into other parish gatherings',
              )}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
            {t('access:permissions.activeDelegations', {
              count: delegatedMembers.length,
            })}
          </span>
        </div>

        {delegatedMembers.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#8a726a]">
            {t(
              'access:permissions.noDelegations',
              'No members currently have cross-town read scopes assigned. All members are strictly restricted to their home hubs.',
            )}
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
                        {t('access:permissions.homeHub', {
                          hub: m.homeTown?.name ?? '—',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-[#8a726a]">
                        {t(
                          'access:permissions.grantedExternal',
                          'Granted External Hubs',
                        )}
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
                        className="px-3 py-1.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-xs font-bold text-[#57423b] flex items-center gap-1.5 cursor-pointer"
                      >
                        <PencilSimple size={13} />
                        <span>
                          {t('access:permissions.editScopes', 'Edit Scopes')}
                        </span>
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
