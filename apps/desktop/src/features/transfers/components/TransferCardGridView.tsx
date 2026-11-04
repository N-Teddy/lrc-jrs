import { useTranslation } from '@jrs/client-core';
import type { ITown } from '@jrs/shared';
import {
  ArrowCounterClockwise,
  ArrowRight,
  CalendarBlank,
  ChatCircleText,
  Phone,
  ShieldCheck,
} from '@phosphor-icons/react';
import type React from 'react';
import emptyTransfersImg from '../../../assets/illustrations/empty-transfers.jpg';
import {
  CardGridSkeleton,
  EmptyState,
  PaginationControl,
  UserAvatar,
} from '../../../components';
import { formatCameroonPhone } from '../../members/utils/member-ui.utils';
import {
  formatTransferDate,
  getDirectionDisplayInfo,
  getTransferDirection,
  type IFlattenedTransferRecord,
} from '../utils/transfer-ui.utils';

interface TransferCardGridViewProps {
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

export const TransferCardGridView: React.FC<TransferCardGridViewProps> = ({
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
  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return <CardGridSkeleton cardCount={Math.min(limit, 8)} />;
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
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <article
              key={item.id}
              onClick={() => onViewMember(item.memberId)}
              className="bg-white rounded-md border border-[#e8e1dd] p-4 shadow-xs hover:border-[#b85028]/40 hover:shadow-md transition-all flex flex-col justify-between gap-3 group cursor-pointer"
            >
              <div className="flex flex-col gap-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar
                      avatarUrl={item.memberAvatar}
                      name={item.memberName}
                      size="md"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors leading-snug">
                        {item.memberName}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#8a726a]">
                        <Phone size={11} className="shrink-0 text-[#8a726a]" />
                        <span className="truncate">
                          {formatCameroonPhone(item.memberPhone)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Relocation Route Display */}
                <div className="flex items-center justify-between text-xs py-1.5 border-y border-[#f4ece9]">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-[#1e1b19] truncate">
                      {fromTown?.name || 'Origin'}
                    </span>
                    <span className="text-[10px] font-mono text-[#8a726a]">
                      {fromTown?.code || '—'}
                    </span>
                  </div>

                  <div className="w-5 h-5 rounded-full bg-[#fff2ee] text-[#b85028] flex items-center justify-center shrink-0 mx-2">
                    <ArrowRight size={11} weight="bold" />
                  </div>

                  <div className="flex flex-col items-end min-w-0 text-right">
                    <span className="font-semibold text-[#1e1b19] truncate">
                      {toTown?.name || 'Destination'}
                    </span>
                    <span className="text-[10px] font-mono text-[#8a726a]">
                      {toTown?.code || '—'}
                    </span>
                  </div>
                </div>

                {/* Relocation Reason if present */}
                {item.reason && (
                  <div className="flex items-start gap-1.5 text-xs text-[#57423b] italic">
                    <ChatCircleText
                      size={13}
                      className="shrink-0 text-[#8a726a] mt-0.5"
                    />
                    <p className="line-clamp-2 leading-relaxed">
                      &ldquo;{item.reason}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & Profile Action */}
              <div className="pt-2.5 border-t border-[#f4ece9] mt-auto flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#8a726a] text-[11px] min-w-0">
                  <CalendarBlank
                    size={13}
                    className="text-[#b85028] shrink-0"
                  />
                  <span className="font-medium shrink-0">{formattedDate}</span>
                  <span className="text-[#d8cfca]">·</span>
                  <ShieldCheck size={13} className="text-[#486b52] shrink-0" />
                  <span className="truncate">{item.transferredBy}</span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewMember(item.memberId);
                  }}
                  className="h-7 px-2.5 rounded bg-[#faf2ee] hover:bg-[#b85028] text-[#b85028] hover:text-white border border-[#e8d5cc] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>{t('transfers:card.viewMember', 'Profile')}</span>
                  <ArrowRight size={12} weight="bold" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-white rounded-xl border border-[#e8e1dd] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a726a]">
        <div>
          {t('common:showingTransfers', { count: transfers.length, total }) ||
            `Showing ${transfers.length} of ${total} recorded relocations`}
        </div>
        <PaginationControl
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
};
