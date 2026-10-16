import type { ITownTransfer } from '@jrs/shared';

export interface IFlattenedTransferRecord extends ITownTransfer {
  id: string;
  memberId: string;
  memberName: string;
  memberAvatar?: string;
  memberPhone: string;
  memberRole: string;
  memberIsJr?: boolean;
  memberCurrentTownId: string;
}

export type TransferDirection = 'INBOUND' | 'OUTBOUND' | 'CROSS_HUB';

export interface DirectionBadgeInfo {
  label: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export function getTransferDirection(
  fromTownId: string,
  toTownId: string,
  activeTownId?: string,
): TransferDirection {
  if (!activeTownId) return 'CROSS_HUB';
  if (toTownId === activeTownId) return 'INBOUND';
  if (fromTownId === activeTownId) return 'OUTBOUND';
  return 'CROSS_HUB';
}

export function getDirectionDisplayInfo(
  direction: TransferDirection,
  t?: any,
): DirectionBadgeInfo {
  switch (direction) {
    case 'INBOUND':
      return {
        label: t ? t('transfers:directions.inbound', 'Inbound') : 'Inbound',
        bgClass: 'bg-[#eef7f0]',
        textClass: 'text-[#2c4e37]',
        borderClass: 'border-[#c2e9ca]',
      };
    case 'OUTBOUND':
      return {
        label: t ? t('transfers:directions.outbound', 'Outbound') : 'Outbound',
        bgClass: 'bg-[#fff8e1]',
        textClass: 'text-[#812901]',
        borderClass: 'border-[#ffe082]',
      };
    default:
      return {
        label: t
          ? t('transfers:directions.interHub', 'Inter-Hub')
          : 'Inter-Hub',
        bgClass: 'bg-[#faf2ee]',
        textClass: 'text-[#57423b]',
        borderClass: 'border-[#e8e1dd]',
      };
  }
}

export function formatTransferDate(dateStr?: string | Date): string {
  if (!dateStr) return 'Recent';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Recent';
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Recent';
  }
}
