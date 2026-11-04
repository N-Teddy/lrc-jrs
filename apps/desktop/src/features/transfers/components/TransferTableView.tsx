import { useTranslation } from '@jrs/client-core';
import type { ITown } from '@jrs/shared';
import {
  ArrowCounterClockwise,
  ArrowRight,
  Check,
  Copy,
  DotsThreeVertical,
  Eye,
  Phone,
  ShieldCheck,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import emptyTransfersImg from '../../../assets/illustrations/empty-transfers.jpg';
import {
  EmptyState,
  PaginationControl,
  TableSkeleton,
  UserAvatar,
} from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';
import {
  formatTransferDate,
  getDirectionDisplayInfo,
  getTransferDirection,
  type IFlattenedTransferRecord,
} from '../utils/transfer-ui.utils';

interface TransferTableViewProps {
  transfers: IFlattenedTransferRecord[];
  isLoading: boolean;
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onViewMember: (memberId: string) => void;
  activeTownId?: string;
  townsMap: Map<string, ITown>;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
}

export const TransferTableView: React.FC<TransferTableViewProps> = ({
  transfers,
  isLoading,
  total,
  page,
  limit,
  onPageChange,
  onViewMember,
  activeTownId,
  townsMap,
  hasActiveFilters = false,
  onClearFilters,
}) => {
  const { t } = useTranslation(['transfers', 'common']);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalPages = Math.ceil(total / limit) || 1;

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
          t('transfers:table.member', 'Member'),
          t('transfers:table.transferPath', 'Relocation Path'),
          t('transfers:table.dateAuthorized', 'Date Authorized'),
          t('common:actions', 'Actions'),
        ]}
        rowCount={Math.min(limit, 8)}
      />
    );
  }

  if (transfers.length === 0) {
    if (hasActiveFilters) {
      return (
        <EmptyState
          size="lg"
          imageSrc={emptyTransfersImg}
          imageAlt="No relocation records match filters"
          title={t(
            'transfers:table.noFilterMatches',
            'No relocation records match your filters',
          )}
          description={t(
            'transfers:table.noFilterMatchesDesc',
            'Try adjusting your search terms or filters.',
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
        imageSrc={emptyTransfersImg}
        imageAlt="No transfer records"
        title={t('transfers:table.noRecords', 'No Relocation Records Yet')}
        description={t(
          'transfers:table.noRecordsDesc',
          'No relocation records logged for this hub yet.',
        )}
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
                {t('transfers:table.member', 'Community Member')}
              </th>
              <th className="py-3 px-4 font-bold">
                {t('transfers:table.route', 'Relocation Route')}
              </th>
              <th className="py-3 px-4 font-bold">
                {t('transfers:table.authority', 'Authority & Sign-off')}
              </th>
              <th className="py-3 px-4 font-bold">
                {t('transfers:table.date', 'Effective Date')}
              </th>
              <th className="py-3 px-4 font-bold">
                {t('transfers:table.reason', 'Relocation Reason')}
              </th>
              <th className="py-3 px-4 font-bold text-right">
                {t('transfers:table.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="text-xs text-[#1e1b19] divide-y divide-[#f4ece9]">
            {transfers.map((item) => {
              const fromTown = townsMap.get(item.fromTownId);
              const toTown = townsMap.get(item.toTownId);
              const direction = getTransferDirection(
                item.fromTownId,
                item.toTownId,
                activeTownId,
              );
              const badge = getDirectionDisplayInfo(direction, t);
              const formattedDate = formatTransferDate(item.transferredAt);

              return (
                <tr
                  key={item.id}
                  onClick={() => onViewMember(item.memberId)}
                  className="hover:bg-[#faf2ee]/70 transition-colors cursor-pointer group"
                >
                  {/* 1. Member Info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={item.memberAvatar}
                        name={item.memberName}
                        size="md"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors">
                          {item.memberName}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#8a726a]">
                          <Phone
                            size={11}
                            className="shrink-0 text-[#8a726a]"
                          />
                          <span>{formatCameroonPhone(item.memberPhone)}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Relocation Route */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1e1b19]">
                        <span>{fromTown?.name || 'Origin'}</span>
                        <ArrowRight
                          size={11}
                          weight="bold"
                          className="text-[#b85028] shrink-0"
                        />
                        <span>{toTown?.name || 'Destination'}</span>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 3. Authority */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-[#fff2ee] text-[#b85028] flex items-center justify-center shrink-0">
                        <ShieldCheck size={14} weight="bold" />
                      </div>
                      <span className="font-semibold text-xs text-[#1e1b19]">
                        {item.transferredBy}
                      </span>
                    </div>
                  </td>

                  {/* 4. Effective Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                    <span className="font-semibold text-[#1e1b19]">
                      {formattedDate}
                    </span>
                  </td>

                  {/* 5. Relocation Reason */}
                  <td className="py-3.5 px-4 max-w-xs">
                    {item.reason ? (
                      <p className="text-xs text-[#57423b] line-clamp-2 italic">
                        &ldquo;{item.reason}&rdquo;
                      </p>
                    ) : (
                      <span className="text-xs text-[#8a726a]">—</span>
                    )}
                  </td>

                  {/* 6. Actions */}
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div
                      className={`relative inline-flex items-center justify-end ${
                        openMenuId === item.id ? 'z-30' : ''
                      }`}
                      ref={openMenuId === item.id ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId(openMenuId === item.id ? null : item.id)
                        }
                        className="w-7 h-7 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] flex items-center justify-center transition-colors cursor-pointer"
                        title={t('common:actions', 'Actions')}
                      >
                        <DotsThreeVertical size={16} weight="bold" />
                      </button>

                      {openMenuId === item.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-md border border-[#e8e1dd] shadow-lg py-1 z-40 flex flex-col animate-in fade-in zoom-in-95 duration-100 text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              onViewMember(item.memberId);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Eye size={15} className="text-[#8a726a]" />
                            <span>
                              {t('transfers:card.viewMember', 'View Profile')}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              handleCopyPhone(item.id, item.memberPhone, e);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-xs text-[#1e1b19] hover:bg-[#faf2ee] flex items-center gap-2 font-medium cursor-pointer"
                          >
                            {copiedId === item.id ? (
                              <>
                                <Check size={15} className="text-[#486b52]" />
                                <span className="text-[#486b52]">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={15} className="text-[#8a726a]" />
                                <span>
                                  {t('transfers:table.copyPhone', 'Copy Phone')}
                                </span>
                              </>
                            )}
                          </button>
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
          {t('common:showingTransfers', { count: transfers.length, total }) ||
            `Showing ${transfers.length} of ${total} recorded relocations`}
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
