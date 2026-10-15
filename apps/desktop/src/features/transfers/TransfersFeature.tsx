import {
  useMembersQuery,
  useTownContext,
  useTownsQuery,
  useTransferTownMutation,
} from '@jrs/client-core';
import type { ITownTransfer, IUser } from '@jrs/shared';
import {
  ArrowRight,
  ArrowsLeftRight,
  MagnifyingGlass,
  Plus,
  ShieldCheck,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { CustomSelect, type SelectOption, UserAvatar } from '../../components';

interface IFlattenedTransferRecord extends ITownTransfer {
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  memberPhone: string;
  memberRole: string;
  memberCurrentTownId: string;
}

export const TransfersFeature: React.FC = () => {
  const { activeTown, canWrite } = useTownContext();
  const { data: towns = [] } = useTownsQuery();

  // Load members across all hubs to aggregate transfer history
  const { data: membersResponse, isLoading: isMembersLoading } =
    useMembersQuery({
      limit: 300,
    });

  const members: IUser[] = useMemo(() => {
    return membersResponse?.items || [];
  }, [membersResponse]);

  // Lookup map for towns
  const townsMap = useMemo(() => {
    return new Map(towns.map((t) => [t.id, t]));
  }, [towns]);

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<
    'ALL' | 'INBOUND' | 'OUTBOUND'
  >('ALL');
  const [selectedTownFilter, setSelectedTownFilter] = useState<string>('ALL');

  // Initiate Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [destinationTownId, setDestinationTownId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [transferError, setTransferError] = useState<string | null>(null);

  const transferMutation = useTransferTownMutation();

  // Aggregate all transfer records from members
  const allTransfers: IFlattenedTransferRecord[] = useMemo(() => {
    const list: IFlattenedTransferRecord[] = [];
    for (const m of members) {
      if (m.transferHistory && m.transferHistory.length > 0) {
        for (const t of m.transferHistory) {
          list.push({
            ...t,
            memberId: m.id,
            memberName: m.fullName,
            memberAvatar: m.avatarUrl,
            memberPhone: m.phoneNumber,
            memberRole: m.role,
            memberCurrentTownId: m.homeTownId,
          });
        }
      }
    }
    // Sort descending by transferredAt
    return list.sort((a, b) => {
      const dateA = new Date(a.transferredAt).getTime();
      const dateB = new Date(b.transferredAt).getTime();
      return dateB - dateA;
    });
  }, [members]);

  // Active town ID for inbound/outbound scope
  const activeTownId = activeTown?.id;

  // Filter transfers
  const filteredTransfers = useMemo(() => {
    return allTransfers.filter((t) => {
      // 1. Town filter
      if (selectedTownFilter !== 'ALL') {
        if (
          t.fromTownId !== selectedTownFilter &&
          t.toTownId !== selectedTownFilter
        ) {
          return false;
        }
      }

      // 2. Direction filter relative to activeTown
      if (activeTownId) {
        if (directionFilter === 'INBOUND' && t.toTownId !== activeTownId) {
          return false;
        }
        if (directionFilter === 'OUTBOUND' && t.fromTownId !== activeTownId) {
          return false;
        }
      }

      // 3. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = t.memberName.toLowerCase().includes(query);
        const matchesAuthor = t.transferredBy.toLowerCase().includes(query);
        const matchesReason = t.reason?.toLowerCase().includes(query) ?? false;
        const matchesPhone = t.memberPhone.includes(query);
        const fromName = townsMap.get(t.fromTownId)?.name.toLowerCase() || '';
        const toName = townsMap.get(t.toTownId)?.name.toLowerCase() || '';
        if (
          !matchesName &&
          !matchesAuthor &&
          !matchesReason &&
          !matchesPhone &&
          !fromName.includes(query) &&
          !toName.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    allTransfers,
    selectedTownFilter,
    directionFilter,
    activeTownId,
    searchTerm,
    townsMap,
  ]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let inboundCount = 0;
    let outboundCount = 0;
    const uniqueMembers = new Set<string>();

    for (const t of allTransfers) {
      uniqueMembers.add(t.memberId);
      if (activeTownId) {
        if (t.toTownId === activeTownId) inboundCount++;
        if (t.fromTownId === activeTownId) outboundCount++;
      }
    }

    return {
      totalRelocations: allTransfers.length,
      inbound: inboundCount,
      outbound: outboundCount,
      transferredMembersCount: uniqueMembers.size,
    };
  }, [allTransfers, activeTownId]);

  // Options for initiate transfer dialog
  const eligibleMembersForTransfer = useMemo(() => {
    return members.filter((m) => {
      if (!activeTownId) return true;
      return m.homeTownId === activeTownId;
    });
  }, [members, activeTownId]);

  const memberSelectOptions: SelectOption[] = useMemo(() => {
    return eligibleMembersForTransfer.map((m) => {
      const townName = townsMap.get(m.homeTownId)?.name || 'Hub';
      return {
        value: m.id,
        label: `${m.fullName} (${m.phoneNumber}) - ${townName}`,
      };
    });
  }, [eligibleMembersForTransfer, townsMap]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const availableDestTowns = useMemo(() => {
    if (!selectedMember) return towns;
    return towns.filter((t) => t.id !== selectedMember.homeTownId);
  }, [towns, selectedMember]);

  const destinationTownOptions: SelectOption[] = useMemo(() => {
    return availableDestTowns.map((t) => ({
      value: t.id,
      label: `${t.name} (${t.code})`,
    }));
  }, [availableDestTowns]);

  const handleOpenTransferModal = () => {
    setTransferError(null);
    setTransferReason('');
    if (eligibleMembersForTransfer.length > 0) {
      setSelectedMemberId(eligibleMembersForTransfer[0].id);
    }
    if (availableDestTowns.length > 0) {
      setDestinationTownId(availableDestTowns[0].id);
    }
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !destinationTownId) {
      setTransferError('Please select a member and a destination hub.');
      return;
    }

    try {
      setTransferError(null);
      await transferMutation.mutateAsync({
        userId: selectedMemberId,
        dto: {
          toTownId: destinationTownId,
          reason: transferReason.trim() || undefined,
        },
      });
      setIsTransferModalOpen(false);
    } catch (err: any) {
      setTransferError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to complete transfer.',
      );
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Page Header & Key Metrics */}
      <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#f4ece9]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
              <ArrowsLeftRight size={28} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#1e1b19] tracking-tight">
                  Inter-Hub Town Transfers
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdbcf]/60 text-[#812901] border border-[#ffb59c]/50">
                  Deanery Ledger
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8a726a] mt-1">
                Official canonical registry of member relocations, pastoral
                jurisdictions, and inter-city transitions across Cameroon.
              </p>
            </div>
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={handleOpenTransferModal}
              className="px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer self-start lg:self-auto shrink-0"
            >
              <Plus size={16} weight="bold" />
              <span>Initiate Member Transfer</span>
            </button>
          )}
        </div>

        {/* 4 Sanctuary Metric Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e1dd] text-[#b85028] flex items-center justify-center font-black text-sm">
              {metrics.totalRelocations}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                Total Relocations
              </span>
              <span className="text-sm font-black text-[#1e1b19]">
                {metrics.totalRelocations} recorded
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#c2e9ca] text-[#2c4e37] flex items-center justify-center font-black text-sm">
              {metrics.inbound}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#2c4e37] uppercase tracking-wider">
                Inbound to {activeTown?.name || 'Hub'}
              </span>
              <span className="text-sm font-black text-[#1e1b19]">
                {metrics.inbound} members received
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#ffdbcf] text-[#812901] flex items-center justify-center font-black text-sm">
              {metrics.outbound}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#812901] uppercase tracking-wider">
                Outbound from {activeTown?.name || 'Hub'}
              </span>
              <span className="text-sm font-black text-[#1e1b19]">
                {metrics.outbound} members relocated
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#faf2ee]/60 border border-[#e8e1dd] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#e8e1dd] text-[#57423b] flex items-center justify-center font-black text-sm">
              {metrics.transferredMembersCount}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                Unique Members
              </span>
              <span className="text-sm font-black text-[#1e1b19]">
                {metrics.transferredMembersCount} in registry
              </span>
            </div>
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t border-[#f4ece9]">
          {/* Omni Search */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by member, coordinator, city, or note..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#faf2ee]/50 border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] focus:outline-none focus:border-[#b85028] focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a726a] hover:text-[#1e1b19] p-0.5"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Direction & Hub Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-44">
              <CustomSelect
                options={[
                  { value: 'ALL', label: 'All Town Hubs' },
                  ...towns.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.code})`,
                  })),
                ]}
                value={selectedTownFilter}
                onChange={(val) => setSelectedTownFilter(val)}
                placeholder="Filter by Hub..."
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { id: 'ALL', label: 'All Direction' },
                  { id: 'INBOUND', label: 'Inbound' },
                  { id: 'OUTBOUND', label: 'Outbound' },
                ] as const
              ).map((filter) => {
                const active = directionFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setDirectionFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#b85028] text-white shadow-2xs'
                        : 'bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] border border-[#e8e1dd]'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Relocation Ledger Table / List */}
      <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[#f4ece9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} weight="bold" className="text-[#b85028]" />
            <h2 className="text-sm font-bold text-[#1e1b19] uppercase tracking-wider">
              Canonical Relocation Ledger ({filteredTransfers.length})
            </h2>
          </div>
          <span className="text-xs text-[#8a726a]">
            {filteredTransfers.length}{' '}
            {filteredTransfers.length === 1 ? 'event' : 'events'} matching
            criteria
          </span>
        </div>

        {isMembersLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 border-3 border-[#b85028] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-[#8a726a]">
              Loading canonical transfer records...
            </span>
          </div>
        ) : filteredTransfers.length > 0 ? (
          <div className="divide-y divide-[#f4ece9]">
            {filteredTransfers.map((item, index) => {
              const fromTown = townsMap.get(item.fromTownId);
              const toTown = townsMap.get(item.toTownId);
              const isItemInbound = item.toTownId === activeTownId;
              const isItemOutbound = item.fromTownId === activeTownId;

              return (
                <div
                  key={`${item.memberId}-${item.transferredAt}-${index}`}
                  className="p-5 sm:p-6 hover:bg-[#fffbf9] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Member Identity & Journey Route */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <UserAvatar
                      name={item.memberName}
                      avatarUrl={item.memberAvatar}
                      size="md"
                    />

                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1e1b19] truncate group-hover:text-[#b85028] transition-colors">
                          {item.memberName}
                        </span>
                        <span className="text-[11px] text-[#8a726a]">
                          {item.memberPhone}
                        </span>
                        {isItemInbound && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eef7f0] text-[#2c4e37] border border-[#c2e9ca]">
                            Inbound
                          </span>
                        )}
                        {isItemOutbound && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff8e1] text-[#812901] border border-[#ffe082]">
                            Outbound
                          </span>
                        )}
                      </div>

                      {/* Relocation Route Display */}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19]">
                          {fromTown?.name || 'Previous Hub'}{' '}
                          <span className="text-[10px] font-mono text-[#8a726a]">
                            ({fromTown?.code || '—'})
                          </span>
                        </span>

                        <div className="w-5 h-5 rounded-full bg-[#fff2ee] text-[#b85028] flex items-center justify-center shrink-0">
                          <ArrowRight size={12} weight="bold" />
                        </div>

                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#faf2ee] border border-[#e8e1dd] text-[#1e1b19]">
                          {toTown?.name || 'New Hub'}{' '}
                          <span className="text-[10px] font-mono text-[#8a726a]">
                            ({toTown?.code || '—'})
                          </span>
                        </span>
                      </div>

                      {/* Reason Quote if present */}
                      {item.reason && (
                        <div className="mt-2 p-2.5 rounded-xl bg-[#faf2ee]/50 border border-[#f4ece9] text-xs text-[#57423b] leading-relaxed max-w-2xl">
                          <span className="font-bold text-[#812901]">
                            Reason:{' '}
                          </span>
                          {item.reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Timestamp */}
                  <div className="flex items-center gap-6 lg:justify-end shrink-0 self-end lg:self-center border-t lg:border-t-0 pt-3 lg:pt-0 border-[#f4ece9] w-full lg:w-auto">
                    <div className="flex flex-col text-left lg:text-right">
                      <span className="text-xs font-bold text-[#1e1b19]">
                        {item.transferredAt
                          ? new Date(item.transferredAt).toLocaleDateString(
                              'en-GB',
                            )
                          : 'Recent'}
                      </span>
                      <span className="text-[11px] text-[#8a726a]">
                        Authorized by {item.transferredBy}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#faf2ee] text-[#8a726a] group-hover:text-[#b85028] group-hover:bg-[#fff2ee] transition-all">
                      <ShieldCheck size={18} weight="bold" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
              <ArrowsLeftRight size={28} weight="duotone" />
            </div>
            <h4 className="text-base font-bold text-[#1e1b19]">
              No Transfer Records Found
            </h4>
            <p className="text-xs text-[#8a726a] max-w-md">
              No inter-hub member relocations match the selected filter. You can
              initiate a new member relocation using the button above.
            </p>
          </div>
        )}
      </div>

      {/* 4. Initiate Member Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-[#e8e1dd] shadow-2xl p-6 sm:p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#f4ece9]">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
                  <ArrowsLeftRight size={22} weight="duotone" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-bold text-[#1e1b19]">
                    Initiate Member Transfer
                  </h2>
                  <p className="text-xs text-[#8a726a]">
                    Relocate a member from {activeTown?.name || 'hub'} to
                    another town hub.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#1e1b19] transition-colors cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {transferError && (
              <div className="p-3.5 rounded-2xl bg-[#ffdad6]/60 border border-[#ffb4ab] text-xs font-semibold text-[#ba1a1a] flex items-center gap-2.5">
                <WarningCircle size={18} weight="fill" className="shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            <form
              onSubmit={handleExecuteTransfer}
              className="flex flex-col gap-5"
            >
              {/* Member Selector */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#1e1b19]">
                  Select Fellowship Member{' '}
                  <span className="text-[#ba1a1a]">*</span>
                </span>
                <CustomSelect
                  options={memberSelectOptions}
                  value={selectedMemberId}
                  onChange={(val) => setSelectedMemberId(val)}
                  placeholder="Select member to transfer..."
                />
              </div>

              {/* Destination Hub Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-[#1e1b19]">
                  Destination Town Hub <span className="text-[#ba1a1a]">*</span>
                </span>
                <CustomSelect
                  options={destinationTownOptions}
                  value={destinationTownId}
                  onChange={(val) => setDestinationTownId(val)}
                  placeholder="Select destination town..."
                />
              </div>

              {/* Pastoral Reason / Relocation Note */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="transfers-feature-reason"
                  className="text-xs font-bold text-[#1e1b19]"
                >
                  Pastoral Reason / Relocation Note{' '}
                  <span className="text-[#8a726a] font-normal">(Optional)</span>
                </label>
                <textarea
                  id="transfers-feature-reason"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Relocated to Douala for university studies or employment..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-[#faf2ee]/40 border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] focus:outline-none focus:border-[#b85028] focus:bg-white transition-all shadow-2xs resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  disabled={transferMutation.isPending}
                  className="px-4 py-2.5 rounded-xl bg-white border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedMemberId ||
                    !destinationTownId ||
                    transferMutation.isPending
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#9c421f] text-xs font-bold text-white transition-all flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {transferMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Transferring...</span>
                    </>
                  ) : (
                    <>
                      <ArrowsLeftRight size={15} weight="bold" />
                      <span>Confirm Transfer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
