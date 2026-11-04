import { useTownContext, useTranslation } from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ArrowCounterClockwise,
  ChatCircleText,
  Check,
  Copy,
  DotsThreeVertical,
  EnvelopeSimple,
  Eye,
  Key,
  PencilSimple,
  Phone,
  Trash,
  UserPlus,
} from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import emptyMembersImg from '../../../assets/illustrations/empty-members.jpg';
import {
  EmptyState,
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
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onRegisterMember?: () => void;
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
  hasActiveFilters = false,
  onClearFilters,
  onRegisterMember,
}) => {
  const { t } = useTranslation();
  const { canWrite } = useTownContext();
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
          t('members:table.member', 'Member'),
          t('members:table.role', 'Role'),
          t('members:table.contactChannel', 'Contact Channel'),
          t('common:actions', 'Actions'),
        ]}
        rowCount={Math.min(limit, 8)}
      />
    );
  }

  if (members.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          size="lg"
          imageSrc={emptyMembersImg}
          imageAlt="No members match filters"
          title={t(
            'members:table.noFilterMatches',
            'No members match your filters',
          )}
          description={t(
            'members:table.noFilterMatchesDesc',
            'Try adjusting your search query or filters.',
          )}
          primaryAction={
            onClearFilters
              ? {
                  label: t('common:clearFilters', 'Clear all filters'),
                  icon: <ArrowCounterClockwise size={15} weight="bold" />,
                  onClick: onClearFilters,
                }
              : undefined
          }
        />
      );
    }

    return (
      <EmptyState
        size="lg"
        imageSrc={emptyMembersImg}
        imageAlt="No members"
        title={t(
          'members:table.directoryEmpty',
          'Community directory is empty',
        )}
        description={t(
          'members:table.directoryEmptyDesc',
          'No members registered in this hub yet.',
        )}
        primaryAction={
          onRegisterMember
            ? {
                label: t(
                  'members:actions.registerMember',
                  'Register First Member',
                ),
                icon: <UserPlus size={16} weight="bold" />,
                onClick: onRegisterMember,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#faf2ee] border-b border-[#e8e1dd] text-[#8a726a] text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3 px-4 font-bold">
                {t('members:table.member', 'Member')}
              </th>
              <th className="py-3 px-4 font-bold">
                {t('members:table.role', 'Role')}
              </th>
              <th className="py-3 px-4 font-bold">
                {t('members:table.contactChannel', 'Contact Channel')}
              </th>
              <th className="py-3 px-4 font-bold text-right">
                {t('members:table.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="text-xs text-[#1e1b19] divide-y divide-[#f4ece9]">
            {members.map((m, index) => {
              const age = calculateAge(m.dateOfBirth);
              const roleInfo = getRoleDisplayInfo(m.role);
              const formattedPhone = formatCameroonPhone(m.phoneNumber);
              const cleanDigits = getCleanDigitsForWhatsApp(m.phoneNumber);
              const isEligibleJr =
                m.isJr ?? (age !== null && age >= 18 && age <= 30);

              // Open dropdown upwards for bottom rows to prevent vertical table overflow
              const openUpwards =
                index >= 2 &&
                index >= members.length - (members.length >= 5 ? 3 : 2);

              return (
                <tr
                  key={m.id}
                  onClick={() => onViewMember(m.id)}
                  className="hover:bg-[#faf2ee]/70 transition-colors cursor-pointer group"
                >
                  {/* 1. Member Name & Age (No redundant town indicative) */}
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
                        {age !== null && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                isEligibleJr
                                  ? 'bg-[#c2e9ca] text-[#2c4e37]'
                                  : 'bg-[#faf2ee] text-[#8a726a]'
                              }`}
                            >
                              {age} yrs {isEligibleJr && '· JR'}
                            </span>
                            {m.gender && (
                              <span className="text-[11px] text-[#8a726a] capitalize">
                                {m.gender.toLowerCase()}
                              </span>
                            )}
                          </div>
                        )}
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

                  {/* 3. Formatted Contact Channels with Icons */}
                  <td
                    className="py-3.5 px-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-1">
                      {/* Phone Channel */}
                      {formattedPhone ? (
                        <div className="flex items-center gap-1.5 text-[#1e1b19] font-mono">
                          <Phone
                            size={13}
                            className="text-[#8a726a] shrink-0"
                          />
                          <span className="font-bold">{formattedPhone}</span>
                          <div className="flex items-center gap-0.5 ml-0.5">
                            <button
                              type="button"
                              onClick={(e) =>
                                handleCopyPhone(m.id, m.phoneNumber, e)
                              }
                              title={
                                copiedId === m.id
                                  ? 'Copied!'
                                  : t('members:table.copyNumber', 'Copy Number')
                              }
                              className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                                copiedId === m.id
                                  ? 'text-[#486b52]'
                                  : 'text-[#8a726a] hover:text-[#b85028] hover:bg-[#faf2ee]'
                              }`}
                            >
                              {copiedId === m.id ? (
                                <Check size={12} weight="bold" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                            {m.isWhatsappVerified && (
                              <a
                                href={`https://wa.me/${cleanDigits}`}
                                target="_blank"
                                rel="noreferrer"
                                title={t(
                                  'members:table.whatsappChat',
                                  'WhatsApp Chat',
                                )}
                                className="w-5 h-5 rounded flex items-center justify-center text-[#2c4e37] hover:opacity-80 transition-opacity cursor-pointer"
                              >
                                <ChatCircleText size={14} weight="fill" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[#8a726a]">
                          <Phone
                            size={13}
                            className="shrink-0 text-[#8a726a]"
                          />
                          <span className="text-xs italic">—</span>
                        </div>
                      )}

                      {/* Email Channel */}
                      {m.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#8a726a]">
                          <EnvelopeSimple
                            size={13}
                            className="shrink-0 text-[#8a726a]"
                          />
                          <span className="truncate max-w-[200px] hover:text-[#1e1b19] transition-colors font-sans">
                            {m.email}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 4. Action Menu Dropdown / Modal */}
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`relative inline-flex items-center justify-end ${openMenuId === m.id ? 'z-30' : ''}`}
                      ref={openMenuId === m.id ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(openMenuId === m.id ? null : m.id)
                        }
                        className="w-7 h-7 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] flex items-center justify-center transition-colors cursor-pointer"
                        title={t('common:actions', 'Actions')}
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
                          {/* View Profile */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onViewMember(m.id);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Eye size={15} className="text-[#8a726a]" />
                            <span>
                              {t('members:table.viewProfile', 'View Profile')}
                            </span>
                          </button>

                          {canWrite && (
                            <>
                              {/* Edit Record */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditMember(m);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <PencilSimple
                                  size={15}
                                  className="text-[#8a726a]"
                                />
                                <span>
                                  {t('members:table.editRecord', 'Edit Member')}
                                </span>
                              </button>

                              {/* Manage Access */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onManageAccess(m);
                                }}
                                className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <Key size={15} className="text-[#8a726a]" />
                                <span>
                                  {t(
                                    'members:table.manageAccess',
                                    'Manage Access',
                                  )}
                                </span>
                              </button>

                              {/* Deactivate Member */}
                              {isCurrentUserAp && onDeleteMember && (
                                <>
                                  <div className="my-1 border-t border-[#f4ece9]" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      onDeleteMember(m);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-[#ba1a1a] hover:bg-[#fff0ee] flex items-center gap-2 font-medium cursor-pointer"
                                  >
                                    <Trash
                                      size={15}
                                      className="text-[#ba1a1a]"
                                    />
                                    <span>
                                      {t(
                                        'members:table.deactivateMember',
                                        'Deactivate Member',
                                      )}
                                    </span>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
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
