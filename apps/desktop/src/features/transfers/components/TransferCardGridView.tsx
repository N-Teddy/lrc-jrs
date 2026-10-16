import { useTranslation } from '@jrs/client-core';
import type { ITown } from '@jrs/shared';
import {
  ArrowRight,
  ArrowsLeftRight,
  CalendarBlank,
  ChatCircleText,
} from '@phosphor-icons/react';
import type React from 'react';
import { PaginationControl, UserAvatar } from '../../../components';
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
}) => {
  const { t } = useTranslation(['transfers', 'common']);
  const totalPages = Math.ceil(total / limit) || 1;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-56 rounded-2xl bg-white border border-[#e8e1dd] p-5 flex flex-col justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#f4ece9]" />
              <div className="space-y-2">
                <div className="h-4 w-28 bg-[#f4ece9] rounded" />
                <div className="h-3 w-16 bg-[#f4ece9] rounded" />
              </div>
            </div>
            <div className="h-10 w-full bg-[#f4ece9] rounded" />
            <div className="h-8 w-full bg-[#f4ece9] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e1dd] shadow-xs p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-14 h-14 rounded-2xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-4">
          <ArrowsLeftRight size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-bold text-[#1e1b19] mb-1">
          No Relocation Records Found
        </h3>
        <p className="text-xs text-[#8a726a] max-w-sm">
          No member town transfers match the active search or filters.
        </p>
      </div>
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
          const badge = getDirectionDisplayInfo(direction);
          const formattedDate = formatTransferDate(item.transferredAt);

          return (
            <article
              key={item.id}
              onClick={() => onViewMember(item.memberId)}
              className="bg-white rounded-2xl border border-[#e8e1dd] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex flex-col gap-3.5">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      avatarUrl={item.memberAvatar}
                      name={item.memberName}
                      size="md"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors">
                        {item.memberName}
                      </span>
                      <span className="text-[11px] text-[#8a726a]">
                        {item.memberPhone}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Relocation Route Display */}
                <div className="p-3 rounded-xl bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#8a726a] uppercase">
                      From
                    </span>
                    <span className="text-xs font-bold text-[#1e1b19] truncate">
                      {fromTown?.name || 'Origin'}{' '}
                      <span className="text-[10px] font-mono text-[#8a726a]">
                        ({fromTown?.code || '—'})
                      </span>
                    </span>
                  </div>

                  <div className="w-6 h-6 rounded-full bg-[#fff2ee] text-[#b85028] flex items-center justify-center shrink-0">
                    <ArrowRight size={12} weight="bold" />
                  </div>

                  <div className="flex flex-col text-right">
                    <span className="text-[10px] font-bold text-[#8a726a] uppercase">
                      To
                    </span>
                    <span className="text-xs font-bold text-[#1e1b19] truncate">
                      {toTown?.name || 'Destination'}{' '}
                      <span className="text-[10px] font-mono text-[#8a726a]">
                        ({toTown?.code || '—'})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Relocation Reason if present */}
                {item.reason && (
                  <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-[#faf2ee]/40 border border-[#f4ece9] text-xs text-[#57423b] italic">
                    <ChatCircleText
                      size={14}
                      className="shrink-0 text-[#8a726a] mt-0.5"
                    />
                    <p className="line-clamp-2 leading-relaxed">
                      &ldquo;{item.reason}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & View Link */}
              <div className="pt-3.5 mt-3.5 border-t border-[#f4ece9] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[#8a726a]">
                  <CalendarBlank size={14} />
                  <span className="text-[11px] font-medium">
                    {formattedDate}
                  </span>
                </div>

                <div className="flex items-center gap-1 font-bold text-[11px] text-[#b85028] group-hover:translate-x-0.5 transition-transform">
                  <span>View Member</span>
                  <ArrowRight size={12} weight="bold" />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="p-4 bg-white rounded-2xl border border-[#e8e1dd] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a726a]">
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
