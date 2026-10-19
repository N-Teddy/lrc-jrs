import { useTownContext, useTranslation } from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ChatCircleText,
  Copy,
  Eye,
  Key,
  PencilSimple,
  Trash,
  User,
} from '@phosphor-icons/react';
import { useState } from 'react';
import {
  PaginationControl,
  TableSkeleton,
  UserAvatar,
} from '../../../components';
import {
  calculateAge,
  formatCameroonPhone,
  getCleanDigitsForWhatsApp,
  getRoleDisplayInfo,
} from '../utils/member-ui.utils';

interface MemberTableViewProps {
  members: IUser[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onViewMember: (memberId: string) => void;
  onEditMember: (member: IUser) => void;
  onManageAccess: (member: IUser) => void;
  onDeleteMember?: (member: IUser) => void;
  isCurrentUserAp: boolean;
}

export const MemberTableView: React.FC<MemberTableViewProps> = ({
  members,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onViewMember,
  onEditMember,
  onManageAccess,
  onDeleteMember,
  isCurrentUserAp,
}) => {
  const { t } = useTranslation();
  const { canWrite } = useTownContext();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / limit) || 1;

  const handleCopyPhone = (id: string, phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (isLoading) {
    return (
      <TableSkeleton
        columns={[
          t('members:table.member'),
          t('members:table.role'),
          t('members:table.contactChannel'),
          t('common:actions', 'Actions'),
        ]}
        rowCount={Math.min(limit, 8)}
      />
    );
  }

  if (members.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-14 h-14 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-4">
          <User size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-bold text-[#1e1b19] mb-1">
          {t('members:table.noMembersFound')}
        </h3>
        <p className="text-xs text-[#8a726a] max-w-sm">
          {t('members:filters.searchPlaceholder')}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#faf2ee] border-b border-[#e8e1dd] text-[#8a726a] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 font-bold">
                {t('members:table.member')}
              </th>
              <th className="py-3 px-4 font-bold">{t('members:table.role')}</th>
              <th className="py-3 px-4 font-bold">
                {t('members:table.contactChannel')}
              </th>
              <th className="py-3 px-4 font-bold text-right">
                {t('members:table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="text-xs text-[#1e1b19] divide-y divide-[#f4ece9]">
            {members.map((m) => {
              const age = calculateAge(m.dateOfBirth);
              const roleInfo = getRoleDisplayInfo(m.role);
              const formattedPhone = formatCameroonPhone(m.phoneNumber);
              const cleanDigits = getCleanDigitsForWhatsApp(m.phoneNumber);
              const isEligibleJr =
                m.isJr ?? (age !== null && age >= 18 && age <= 30);
              return (
                <tr
                  key={m.id}
                  onClick={() => onViewMember(m.id)}
                  className="hover:bg-[#faf2ee]/70 transition-colors cursor-pointer group"
                >
                  {/* 1. Member Name & Age */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={m.avatarUrl}
                        name={m.fullName}
                        size="md"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors">
                          {m.fullName}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {age !== null && (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isEligibleJr
                                  ? 'bg-[#c2e9ca] text-[#2c4e37]'
                                  : 'bg-[#faf2ee] text-[#8a726a]'
                              }`}
                            >
                              {age} yrs {isEligibleJr && '· JR'}
                            </span>
                          )}
                          <span className="text-[11px] text-[#8a726a] truncate">
                            {m.homeTown?.name ?? 'Assigned Hub'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Role */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.border}`}
                    >
                      {roleInfo.shortLabel}
                    </span>
                  </td>

                  {/* 3. Contact & WhatsApp */}
                  <td
                    className="py-3.5 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1e1b19]">
                          {formattedPhone || '—'}
                        </span>
                        {m.phoneNumber && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) =>
                                handleCopyPhone(m.id, m.phoneNumber, e)
                              }
                              title={
                                copiedId === m.id
                                  ? 'Copied!'
                                  : t('members:table.copyNumber')
                              }
                              className={`w-6 h-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                                copiedId === m.id
                                  ? 'text-[#486b52]'
                                  : 'text-[#8a726a] hover:text-[#b85028] hover:bg-[#faf2ee]'
                              }`}
                            >
                              <Copy size={13} />
                            </button>
                            {m.isWhatsappVerified && (
                              <a
                                href={`https://wa.me/${cleanDigits}`}
                                target="_blank"
                                rel="noreferrer"
                                title={t('members:table.whatsappChat')}
                                className="w-6 h-6 rounded flex items-center justify-center text-[#486b52] hover:bg-[#c2e9ca]/40 transition-colors cursor-pointer"
                              >
                                <ChatCircleText size={15} weight="fill" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {m.email && (
                        <span className="text-[11px] text-[#8a726a] truncate max-w-[200px]">
                          {m.email}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. Actions */}
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onViewMember(m.id)}
                        title={t('members:table.viewProfile')}
                        className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEditMember(m)}
                            title={t('members:table.editRecord')}
                            className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onManageAccess(m)}
                            title={t('members:table.manageAccess')}
                            className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                          >
                            <Key size={16} />
                          </button>
                          {isCurrentUserAp && onDeleteMember && (
                            <button
                              type="button"
                              onClick={() => onDeleteMember(m)}
                              title={t('members:table.deactivateMember')}
                              className="w-7 h-7 rounded-md hover:bg-[#ffdad6] flex items-center justify-center text-[#8a726a] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                            >
                              <Trash size={16} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-[#faf2ee] border-t border-[#e8e1dd] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a726a]">
        <div>
          {t('common:showingMembers', { count: members.length, total }) ||
            `Showing ${members.length} of ${total} registered members`}
        </div>
        <PaginationControl
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          variant="white"
        />
      </div>
    </div>
  );
};
