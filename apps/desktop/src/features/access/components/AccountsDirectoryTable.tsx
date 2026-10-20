import { useTranslation } from '@jrs/client-core';
import type { ITown, IUser } from '@jrs/shared';
import {
  ChatCircleText,
  ClockCountdown,
  Crown,
  DotsThreeVertical,
  EnvelopeSimple,
  Globe,
  Key,
  Phone,
  Prohibit,
  ShieldCheck,
  User,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  PaginationControl,
  TableSkeleton,
  UserAvatar,
} from '../../../components';
import {
  formatCameroonPhone,
  getCleanDigitsForWhatsApp,
  getRoleDisplayInfo,
} from '../../members/utils/member-ui.utils';

interface AccountsDirectoryTableProps {
  members: IUser[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onOpenManageAccess: (member: IUser) => void;
  onOpenScopeModal: (member: IUser) => void;
  onOpenChangePc?: (member: IUser) => void;
  onViewMemberDetail: (memberId: string) => void;
  availableTowns: ITown[];
  isCurrentUserAp: boolean;
}

export const AccountsDirectoryTable: React.FC<AccountsDirectoryTableProps> = ({
  members,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onOpenManageAccess,
  onOpenScopeModal,
  onOpenChangePc,
  onViewMemberDetail,
  availableTowns,
  isCurrentUserAp,
}) => {
  const { t } = useTranslation(['access', 'members', 'common']);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return (
      <TableSkeleton
        columns={[
          t('access:table.member', 'Member / Identity'),
          t('access:table.appAccess', 'Portal Status'),
          t('access:table.activeTown', 'Assigned Hub'),
          t('common:actions', 'Actions'),
        ]}
        rowCount={Math.min(limit, 8)}
      />
    );
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-12 flex flex-col items-center justify-center text-center min-h-[360px]">
        <div className="w-14 h-14 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-4">
          <ShieldCheck size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-bold text-[#1e1b19] mb-1">
          {t('access:table.noAccounts') ||
            'No accounts found matching criteria'}
        </h3>
        <p className="text-xs text-[#8a726a] max-w-sm">
          Try clearing filters or search terms to inspect member portal
          accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs flex flex-col overflow-hidden">
      <div className="overflow-x-auto min-h-[340px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#faf2ee] border-b border-[#e8e1dd] text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              <th className="py-3.5 px-6">
                {t('access:table.member') || 'Member & Hub'}
              </th>
              <th className="py-3.5 px-6">
                {t('access:table.credentials') || 'Login Identifier & Email'}
              </th>
              <th className="py-3.5 px-4">
                {t('access:table.role') || 'Role'}
              </th>
              <th className="py-3.5 px-6">
                {t('access:table.status') || 'Portal Status'}
              </th>
              <th className="py-3.5 px-4">
                {t('access:table.crossTownScopes') || 'Hub Scopes'}
              </th>
              <th className="py-3.5 px-6 text-right">
                {t('access:table.actions') || 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f4ece9] text-xs text-[#1e1b19]">
            {members.map((m, index) => {
              const roleInfo = getRoleDisplayInfo(m.role);
              const formattedPhone = formatCameroonPhone(m.phoneNumber);
              const cleanDigits = getCleanDigitsForWhatsApp(m.phoneNumber);

              const isRevoked = m.account?.isAccessRevoked ?? false;
              const isTempPassword = m.isTemporaryPassword ?? false;
              const allowedTownIds = m.account?.allowedReadTownIds || [];

              // Open dropdown upwards for bottom rows to prevent vertical table overflow and scrollbars
              const openUpwards =
                index >= 2 &&
                index >= members.length - (members.length >= 5 ? 3 : 2);

              // Town codes for granted external hubs
              const externalTownCodes = allowedTownIds
                .map((id) => availableTowns.find((t) => t.id === id)?.code)
                .filter(Boolean) as string[];

              return (
                <tr
                  key={m.id}
                  className="hover:bg-[#fffbf9] transition-colors group"
                >
                  {/* 1. Member Identity */}
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={m.avatarUrl}
                        name={m.fullName}
                        size="md"
                      />
                      <div className="flex flex-col min-w-0">
                        <span
                          onClick={() => onViewMemberDetail(m.id)}
                          className="font-bold text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors cursor-pointer"
                        >
                          {m.fullName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f4ece9] text-[#57423b]">
                            {m.homeTown?.code ?? 'HUB'}
                          </span>
                          <span className="text-[11px] text-[#8a726a] truncate">
                            {m.homeTown?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Login Credentials */}
                  <td className="py-3.5 px-6">
                    <div className="flex flex-col gap-0.5 font-mono">
                      <div className="flex items-center gap-1.5 text-[#1e1b19]">
                        <Phone size={13} className="text-[#8a726a] shrink-0" />
                        <span className="font-bold">{formattedPhone}</span>
                        {m.isWhatsappVerified && (
                          <a
                            href={`https://wa.me/${cleanDigits}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Verified WhatsApp Contact"
                            className="p-0.5 rounded text-[#2c4e37] hover:opacity-85"
                          >
                            <ChatCircleText size={14} weight="fill" />
                          </a>
                        )}
                      </div>
                      {m.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8a726a] font-sans">
                          <EnvelopeSimple size={13} className="shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 3. Role */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.border}`}
                    >
                      {roleInfo.shortLabel}
                    </span>
                  </td>

                  {/* 4. Portal Status */}
                  <td className="py-3.5 px-6">
                    {isRevoked ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#ffdad6] text-[#ba1a1a]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]" />
                        <span>
                          {t('access:table.suspended') || 'Suspended'}
                        </span>
                      </span>
                    ) : isTempPassword ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#fff8e1] text-[#b78103] border border-[#ffe082]">
                        <ClockCountdown size={13} weight="bold" />
                        <span>
                          {t('access:table.mustChangePassword') ||
                            'Temp Code Active'}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#c2e9ca] text-[#2c4e37]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#486b52]" />
                        <span>{t('access:table.active') || 'Active'}</span>
                      </span>
                    )}
                  </td>

                  {/* 5. Cross-Hub Scopes */}
                  <td className="py-3.5 px-4">
                    {externalTownCodes.length > 0 ? (
                      <div className="flex items-center gap-1 flex-wrap">
                        {externalTownCodes.map((code) => (
                          <span
                            key={code}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#eef7f0] text-[#2c4e37] border border-[#c2e9ca]"
                          >
                            {code}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#8a726a]">
                        {t('access:table.homeOnly') || 'Home Hub Only'}
                      </span>
                    )}
                  </td>

                  {/* 6. Actions */}
                  <td className="py-3.5 px-6 text-right">
                    <div className="relative inline-flex items-center gap-2 justify-end">
                      {/* Three-dot dropdown menu */}
                      <div
                        className={`relative ${openMenuId === m.id ? 'z-30' : ''}`}
                        ref={openMenuId === m.id ? menuRef : undefined}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === m.id ? null : m.id)
                          }
                          className="w-7 h-7 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <DotsThreeVertical size={16} weight="bold" />
                        </button>

                        {openMenuId === m.id && (
                          <div
                            className={`absolute right-0 ${
                              openUpwards
                                ? 'bottom-full mb-1.5 origin-bottom-right'
                                : 'top-full mt-1 origin-top-right'
                            } w-48 bg-white rounded-xl border border-[#e8e1dd] shadow-lg py-1 z-40 flex flex-col animate-in fade-in zoom-in-95 duration-100 text-left`}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenManageAccess(m);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Key size={14} className="text-[#8a726a]" />
                              <span>
                                {isTempPassword
                                  ? t(
                                      'access:table.resend',
                                      'Resend Credentials',
                                    )
                                  : t(
                                      'access:table.manageAccess',
                                      'Manage Credentials',
                                    )}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenScopeModal(m);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Globe size={14} className="text-[#8a726a]" />
                              <span>
                                {t(
                                  'access:table.manageScopes',
                                  'Cross-Hub Scopes',
                                )}
                              </span>
                            </button>

                            {onOpenChangePc && m.role === 'PC' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onOpenChangePc(m);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-[#b85028] hover:bg-[#fff2ee] flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <Crown size={14} weight="bold" />
                                <span>Change Town PC</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onViewMemberDetail(m.id);
                              }}
                              className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <User size={14} className="text-[#8a726a]" />
                              <span>
                                {t('members:table.viewProfile', 'View Profile')}
                              </span>
                            </button>

                            {isCurrentUserAp && (
                              <>
                                <div className="my-1 border-t border-[#f4ece9]" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    onOpenManageAccess(m);
                                  }}
                                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 font-medium cursor-pointer ${
                                    !isRevoked
                                      ? 'text-[#ba1a1a] hover:bg-[#ffdad6]/40'
                                      : 'text-[#2c4e37] hover:bg-[#c2e9ca]/40'
                                  }`}
                                >
                                  <Prohibit size={14} weight="bold" />
                                  <span>
                                    {!isRevoked
                                      ? t(
                                          'access:table.suspend',
                                          'Suspend Access',
                                        )
                                      : t(
                                          'access:table.reactivate',
                                          'Reactivate Access',
                                        )}
                                  </span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 bg-white border-t border-[#e8e1dd] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a726a]">
          <div>
            {t('common:showingAccounts', { count: members.length, total }) ||
              `Showing ${members.length} of ${total} registered members`}
          </div>
          <PaginationControl
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};
