import { useTranslation } from '@jrs/client-core';
import type { ITown } from '@jrs/shared';
import {
  ArrowRight,
  ArrowsLeftRight,
  Check,
  Copy,
  Eye,
  ShieldCheck,
} from '@phosphor-icons/react';
import type React from 'react';
import { useState } from 'react';
import { PaginationControl, UserAvatar } from '../../../components';
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
}) => {
  const { t } = useTranslation(['transfers', 'common']);
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
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-8 flex flex-col items-center justify-center min-h-[360px] animate-pulse">
        <div className="w-10 h-10 rounded-full bg-[#f4ece9] mb-4" />
        <div className="h-4 w-48 bg-[#f4ece9] rounded mb-2" />
        <div className="h-3 w-32 bg-[#f4ece9] rounded" />
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-12 flex flex-col items-center justify-center text-center min-h-[320px]">
        <div className="w-14 h-14 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] mb-4">
          <ArrowsLeftRight size={28} weight="duotone" />
        </div>
        <h3 className="text-base font-bold text-[#1e1b19] mb-1">
          {t('transfers:table.noRecords', 'No Relocation Records Found')}
        </h3>
        <p className="text-xs text-[#8a726a] max-w-sm">
          {t(
            'transfers:table.noRecordsDesc',
            'No member town transfers match the active search or filters.',
          )}
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
                {t('transfers:table.member', 'Fellowship Member')}
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
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-[#8a726a]">
                            {item.memberPhone}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                            {item.memberRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Relocation Route */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19]">
                          {fromTown?.name || 'Origin'}{' '}
                          <span className="text-[10px] font-mono text-[#8a726a]">
                            ({fromTown?.code || '—'})
                          </span>
                        </span>
                        <div className="w-4 h-4 rounded-full bg-[#fff2ee] text-[#b85028] flex items-center justify-center shrink-0">
                          <ArrowRight size={10} weight="bold" />
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19]">
                          {toTown?.name || 'Destination'}{' '}
                          <span className="text-[10px] font-mono text-[#8a726a]">
                            ({toTown?.code || '—'})
                          </span>
                        </span>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bgClass} ${badge.textClass} ${badge.borderClass}`}
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
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#1e1b19]">
                          {item.transferredBy}
                        </span>
                        <span className="text-[10px] text-[#8a726a]">
                          {t(
                            'transfers:table.authorizedSignOff',
                            'Authorized Sign-off',
                          )}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* 4. Effective Date */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1e1b19]">
                        {formattedDate}
                      </span>
                      <span className="text-[10px] text-[#8a726a]">
                        {t('transfers:table.transferLedger', 'Transfer Ledger')}
                      </span>
                    </div>
                  </td>

                  {/* 5. Relocation Reason */}
                  <td className="py-3.5 px-4 max-w-xs">
                    {item.reason ? (
                      <p className="text-xs text-[#57423b] line-clamp-2 italic bg-[#faf2ee]/50 px-2 py-1 rounded border border-[#f4ece9]">
                        &ldquo;{item.reason}&rdquo;
                      </p>
                    ) : (
                      <span className="text-xs text-[#8a726a] italic">
                        {t(
                          'transfers:table.standardTransfer',
                          'Standard fellowship transfer',
                        )}
                      </span>
                    )}
                  </td>

                  {/* 6. Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={(e) =>
                          handleCopyPhone(item.id, item.memberPhone, e)
                        }
                        title={t(
                          'transfers:table.copyPhone',
                          'Copy Member Phone',
                        )}
                        className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                      >
                        {copiedId === item.id ? (
                          <Check size={16} className="text-[#486b52]" />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewMember(item.memberId)}
                        title={t(
                          'transfers:table.viewProfile',
                          'View Member Profile & Relocation Ledger',
                        )}
                        className="w-7 h-7 rounded-md hover:bg-[#faf2ee] flex items-center justify-center text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                      >
                        <Eye size={16} />
                      </button>
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
