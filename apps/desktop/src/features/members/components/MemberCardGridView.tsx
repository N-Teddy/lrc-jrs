import { useTranslation } from '@jrs/client-core';
import type { IUser } from '@jrs/shared';
import {
  ArrowRight,
  Cake,
  ChatCircleText,
  DotsThreeVertical,
  EnvelopeSimple,
  Key,
  PencilSimple,
  Phone,
  Trash,
  User,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { UserAvatar } from '../../../components';
import {
  calculateAge,
  formatCameroonPhone,
  getCleanDigitsForWhatsApp,
  getRoleDisplayInfo,
} from '../utils/member-ui.utils';

interface MemberCardGridViewProps {
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

export const MemberCardGridView: React.FC<MemberCardGridViewProps> = ({
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
  const totalPages = Math.ceil(total / limit) || 1;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close three-dot menu on click outside or Escape
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-56 rounded-xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f4ece9]" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-[#f4ece9] rounded" />
                <div className="h-3 w-16 bg-[#f4ece9] rounded" />
              </div>
            </div>
            <div className="h-4 w-36 bg-[#f4ece9] rounded" />
            <div className="h-8 w-full bg-[#f4ece9] rounded-md" />
          </div>
        ))}
      </div>
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.map((m) => {
          const age = calculateAge(m.dateOfBirth);
          const roleInfo = getRoleDisplayInfo(m.role);
          const formattedPhone = formatCameroonPhone(m.phoneNumber);
          const cleanDigits = getCleanDigitsForWhatsApp(m.phoneNumber);
          const isEligibleJr =
            m.isJr ?? (age !== null && age >= 18 && age <= 30);
          return (
            <article
              key={m.id}
              onClick={() => onViewMember(m.id)}
              className="bg-white rounded-xl border border-[#e8e1dd] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      avatarUrl={m.avatarUrl}
                      name={m.fullName}
                      size="lg"
                    />
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-sm font-bold text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors">
                        {m.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleInfo.badgeBg} ${roleInfo.badgeText} ${roleInfo.border}`}
                        >
                          {roleInfo.shortLabel}
                        </span>
                        <span className="inline-flex px-1.5 py-0.5 rounded bg-[#f4ece9] text-[#57423b] text-[10px] font-mono font-bold">
                          {m.homeTown?.code ?? 'HUB'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Three-dot Action Menu */}
                  <div
                    className="relative shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    ref={openMenuId === m.id ? menuRef : undefined}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(openMenuId === m.id ? null : m.id)
                      }
                      title={t('members:table.actions')}
                      className="w-7 h-7 rounded-lg text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <DotsThreeVertical size={16} weight="bold" />
                    </button>

                    {openMenuId === m.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-[#e8e1dd] shadow-lg py-1 z-30 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditMember(m);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <PencilSimple
                            size={14}
                            weight="bold"
                            className="text-[#8a726a]"
                          />
                          <span>{t('members:table.editRecord')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onManageAccess(m);
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                        >
                          <Key
                            size={14}
                            weight="bold"
                            className="text-[#8a726a]"
                          />
                          <span>{t('members:table.manageAccess')}</span>
                        </button>

                        {isCurrentUserAp && onDeleteMember && (
                          <>
                            <div className="my-1 border-t border-[#f4ece9]" />
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onDeleteMember(m);
                              }}
                              className="w-full px-3 py-1.5 text-left text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Trash size={14} weight="bold" />
                              <span>{t('members:table.deactivateMember')}</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Demographic & Age Badge */}
                {age !== null && (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-[#faf2ee] rounded-xl mb-3.5 text-xs text-[#57423b]">
                    <Cake size={16} className="text-[#486b52] shrink-0" />
                    <span className="font-bold">{age} yrs</span>
                    <span className="text-[#8a726a]">•</span>
                    <span
                      className={`font-semibold ${
                        isEligibleJr ? 'text-[#486b52]' : 'text-[#8a726a]'
                      }`}
                    >
                      {isEligibleJr ? 'Eligible Youth' : 'Senior Cohort'}
                    </span>
                  </div>
                )}

                {/* Contact Rows */}
                <div
                  className="flex flex-col gap-1.5 text-xs mb-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between py-0.5">
                    <div className="flex items-center gap-2 text-[#8a726a]">
                      <Phone size={15} className="shrink-0" />
                      <span className="font-mono text-[#1e1b19] font-medium">
                        {formattedPhone || '—'}
                      </span>
                    </div>
                    {m.isWhatsappVerified && (
                      <a
                        href={`https://wa.me/${cleanDigits}`}
                        target="_blank"
                        rel="noreferrer"
                        title={t('members:table.whatsappChat')}
                        className="p-1 rounded-md bg-[#c2e9ca] text-[#2c4e37] hover:opacity-85 transition-opacity"
                      >
                        <ChatCircleText size={15} weight="fill" />
                      </a>
                    )}
                  </div>

                  {m.email && (
                    <div className="flex items-center gap-2 text-[#8a726a] py-0.5">
                      <EnvelopeSimple size={15} className="shrink-0" />
                      <span className="truncate text-[#1e1b19] font-medium">
                        {m.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-[#f4ece9] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#8a726a]">
                    {m.homeTown?.code ?? '—'}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-[#b85028] group-hover:underline inline-flex items-center gap-1">
                  <span>{t('members:table.viewProfile')}</span>
                  <ArrowRight size={13} weight="bold" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 bg-white rounded-xl border border-[#e8e1dd] shadow-xs flex items-center justify-between text-xs text-[#8a726a]">
          <div>
            {t('common:showingMembers', { count: members.length, total }) ||
              `Showing ${members.length} of ${total} registered members`}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-2.5 py-1 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {t('common:prev') || 'Prev'}
            </button>
            <span className="px-3 py-1 font-bold text-[#1e1b19]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-2.5 py-1 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19] font-medium disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {t('common:next') || 'Next'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
